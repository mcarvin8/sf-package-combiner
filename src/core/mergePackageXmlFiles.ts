import { readFile } from 'node:fs/promises';
import { sfXmlns } from '../utils/constants.js';
import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';
import { mapLimit } from '../utils/mapLimit.js';
import { determineApiVersion } from './determineApiVersion.js';
import { ParsedManifestType, parseManifestXml } from './parseManifest.js';
import { MergePackageResult, PackageManifestObject } from './types.js';
import { writePackage } from './writePackage.js';

/**
 * Mutable state shared across the concurrent per-file processing in `mergePackageXmlFiles`.
 * Bundled into one object so each processing step is its own top-level function rather than
 * a closure nested inside `mergePackageXmlFiles` -- keeps that function's own complexity low.
 */
type MergeState = {
  warnings: string[];
  apiVersions: string[];
  // type name (lowercased) -> member -> source files that contained it
  origins: Map<string, Map<string, string[]>>;
  // type name (lowercased) -> the casing first seen for it, used for output/reporting
  canonicalTypeNames: Map<string, string>;
  // type name (lowercased) -> index (in `files`) that contributed the current canonical casing.
  // mapLimit processes files concurrently, so completion order doesn't match `files` order --
  // track the source index explicitly so the canonical casing is deterministic regardless of
  // which file's read/parse happens to finish first.
  canonicalTypeSourceIndex: Map<string, number>;
};

function createMergeState(): MergeState {
  return {
    warnings: [],
    apiVersions: [],
    origins: new Map(),
    canonicalTypeNames: new Map(),
    canonicalTypeSourceIndex: new Map(),
  };
}

function recordManifestType(type: ParsedManifestType, filePath: string, index: number, state: MergeState): void {
  // Stryker disable next-line MethodExpression -- toUpperCase() would group identically; metadata type names are ASCII, so casing of the internal grouping key is unobservable
  const typeKey = type.name.toLowerCase();
  if (isEarlierSource(index, state.canonicalTypeSourceIndex.get(typeKey))) {
    state.canonicalTypeNames.set(typeKey, type.name);
    state.canonicalTypeSourceIndex.set(typeKey, index);
  }
  const members = state.origins.get(typeKey) ?? new Map<string, string[]>();
  state.origins.set(typeKey, members);
  for (const memberName of type.members) {
    const sourceFiles = members.get(memberName) ?? [];
    members.set(memberName, sourceFiles);
    sourceFiles.push(filePath);
  }
}

function recordApiVersion(version: string | null, apiVersions: string[]): void {
  // Stryker disable next-line ConditionalExpression,LogicalOperator -- null/undefined version doesn't affect max computation in determineApiVersion
  if (version && !apiVersions.includes(version)) {
    apiVersions.push(version);
  }
}

async function processManifestFile(filePath: string, index: number, state: MergeState): Promise<void> {
  try {
    const xml = await readFile(filePath, 'utf-8');
    const manifest = parseManifestXml(xml);
    if (manifest.types.length === 0) {
      state.warnings.push(`Invalid or empty package.xml: ${filePath}`);
      return;
    }

    for (const type of manifest.types) {
      recordManifestType(type, filePath, index, state);
    }
    recordApiVersion(manifest.version, state.apiVersions);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    state.warnings.push(`Invalid or empty package.xml: ${filePath}. ${message}`);
  }
}

function buildPackageContents(
  origins: Map<string, Map<string, string[]>>,
  canonicalTypeNames: Map<string, string>,
  version: string | undefined,
): PackageManifestObject {
  return {
    Package: {
      '@_xmlns': sfXmlns,
      types: Array.from(origins.entries())
        .map(([typeKey, members]) => ({
          members: Array.from(members.keys()).sort((a, b) => a.localeCompare(b)),
          // v8 ignore next -- canonicalTypeNames is always populated for every typeKey in origins (see isEarlierSource loop above), so this fallback is unreachable
          name: canonicalTypeNames.get(typeKey) ?? typeKey,
        }))
        .sort(sortTypesWithCustomObjectFirst),
      ...(version !== undefined ? { version } : {}),
    },
  };
}

export async function mergePackageXmlFiles(
  files: string[] | null,
  combinedPackage: string,
  userApiVersion: string | null,
  noApiVersion: boolean,
  dryRun = false,
): Promise<MergePackageResult> {
  const state = createMergeState();
  const concurrencyLimit = getConcurrencyThreshold();

  if (files) {
    await mapLimit(
      files.map((filePath, index) => ({ filePath, index })),
      concurrencyLimit,
      ({ filePath, index }) => processManifestFile(filePath, index, state),
    );
  }

  const { duplicates, duplicatesRemoved, membersByType, totalMembers } = summarizeOrigins(
    state.origins,
    state.canonicalTypeNames,
  );
  const version = determineApiVersion(state.apiVersions, userApiVersion, noApiVersion);

  if (!dryRun) {
    const packageContents = buildPackageContents(state.origins, state.canonicalTypeNames, version);
    await writePackage(packageContents, combinedPackage);
  }

  return {
    warnings: state.warnings,
    types: state.origins.size,
    members: totalMembers,
    duplicatesRemoved,
    duplicates,
    membersByType,
    apiVersion: version,
  };
}

/**
 * Whether a type name's source file index should replace the current canonical casing.
 * Exported so it's directly unit-testable -- `mapLimit` processes files concurrently, so
 * exercising this via the real merge would depend on nondeterministic completion timing.
 */
export function isEarlierSource(candidateIndex: number, existingIndex: number | undefined): boolean {
  return existingIndex === undefined || candidateIndex < existingIndex;
}

export const CUSTOM_OBJECT_TYPE = 'CustomObject';

export function sortTypesWithCustomObjectFirst(a: { name: string }, b: { name: string }): number {
  const aIsCustomObject = a.name.toLowerCase() === CUSTOM_OBJECT_TYPE.toLowerCase();
  const bIsCustomObject = b.name.toLowerCase() === CUSTOM_OBJECT_TYPE.toLowerCase();
  if (aIsCustomObject && !bIsCustomObject) return -1;
  if (!aIsCustomObject && bIsCustomObject) return 1;
  return a.name.localeCompare(b.name);
}

function summarizeOrigins(
  origins: Map<string, Map<string, string[]>>,
  canonicalTypeNames: Map<string, string>,
): {
  duplicates: Array<{ type: string; member: string; files: string[] }>;
  duplicatesRemoved: number;
  membersByType: Record<string, number>;
  totalMembers: number;
} {
  const duplicates: Array<{ type: string; member: string; files: string[] }> = [];
  const membersByType: Record<string, number> = {};
  let duplicatesRemoved = 0;
  let totalMembers = 0;

  for (const [typeKey, members] of origins.entries()) {
    // v8 ignore next -- canonicalTypeNames is always populated for every typeKey in origins (see isEarlierSource loop in mergePackageXmlFiles), so this fallback is unreachable
    const typeName = canonicalTypeNames.get(typeKey) ?? typeKey;
    membersByType[typeName] = members.size;
    totalMembers += members.size;
    for (const [memberName, sourceFiles] of members.entries()) {
      if (sourceFiles.length > 1) {
        duplicatesRemoved += sourceFiles.length - 1;
        duplicates.push({
          type: typeName,
          member: memberName,
          files: [...sourceFiles].sort((a, b) => a.localeCompare(b)),
        });
      }
    }
  }

  duplicates.sort((a, b) => a.type.localeCompare(b.type) || a.member.localeCompare(b.member));

  return { duplicates, duplicatesRemoved, membersByType, totalMembers };
}
