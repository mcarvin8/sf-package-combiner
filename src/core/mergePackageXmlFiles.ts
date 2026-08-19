import { readFile } from 'node:fs/promises';
import { sfXmlns } from '../utils/constants.js';
import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';
import { mapLimit } from '../utils/mapLimit.js';
import { determineApiVersion } from './determineApiVersion.js';
import { parseManifestXml } from './parseManifest.js';
import { MergePackageResult, PackageManifestObject } from './types.js';
import { writePackage } from './writePackage.js';

export async function mergePackageXmlFiles(
  files: string[] | null,
  combinedPackage: string,
  userApiVersion: string | null,
  noApiVersion: boolean,
  dryRun = false,
): Promise<MergePackageResult> {
  const warnings: string[] = [];
  const apiVersions: string[] = [];
  const concurrencyLimit = getConcurrencyThreshold();
  // type name (lowercased) -> member -> source files that contained it
  const origins = new Map<string, Map<string, string[]>>();
  // type name (lowercased) -> the casing first seen for it, used for output/reporting
  const canonicalTypeNames = new Map<string, string>();
  // type name (lowercased) -> index (in `files`) that contributed the current canonical casing.
  // mapLimit processes files concurrently, so completion order doesn't match `files` order --
  // track the source index explicitly so the canonical casing is deterministic regardless of
  // which file's read/parse happens to finish first.
  const canonicalTypeSourceIndex = new Map<string, number>();

  if (files) {
    await mapLimit(
      files.map((filePath, index) => ({ filePath, index })),
      concurrencyLimit,
      async ({ filePath, index }) => {
        try {
          const xml = await readFile(filePath, 'utf-8');
          const manifest = parseManifestXml(xml);
          if (manifest.types.length === 0) {
            warnings.push(`Invalid or empty package.xml: ${filePath}`);
            return;
          }

          for (const type of manifest.types) {
            // Stryker disable next-line MethodExpression -- toUpperCase() would group identically; metadata type names are ASCII, so casing of the internal grouping key is unobservable
            const typeKey = type.name.toLowerCase();
            if (isEarlierSource(index, canonicalTypeSourceIndex.get(typeKey))) {
              canonicalTypeNames.set(typeKey, type.name);
              canonicalTypeSourceIndex.set(typeKey, index);
            }
            const members = origins.get(typeKey) ?? new Map<string, string[]>();
            origins.set(typeKey, members);
            for (const memberName of type.members) {
              const sourceFiles = members.get(memberName) ?? [];
              members.set(memberName, sourceFiles);
              sourceFiles.push(filePath);
            }
          }

          const version = manifest.version;
          // Stryker disable next-line ConditionalExpression,LogicalOperator -- null/undefined version doesn't affect max computation in determineApiVersion
          if (version && !apiVersions.includes(version)) {
            apiVersions.push(version);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          warnings.push(`Invalid or empty package.xml: ${filePath}. ${message}`);
        }
      },
    );
  }

  const { duplicates, duplicatesRemoved, membersByType, totalMembers } = summarizeOrigins(origins, canonicalTypeNames);
  const version = determineApiVersion(apiVersions, userApiVersion, noApiVersion);

  if (!dryRun) {
    const packageContents: PackageManifestObject = {
      Package: {
        '@_xmlns': sfXmlns,
        types: Array.from(origins.entries())
          .map(([typeKey, members]) => ({
            members: Array.from(members.keys()).sort((a, b) => a.localeCompare(b)),
            name: canonicalTypeNames.get(typeKey) ?? typeKey,
          }))
          .sort(sortTypesWithCustomObjectFirst),
        ...(version !== undefined ? { version } : {}),
      },
    };
    await writePackage(packageContents, combinedPackage);
  }

  return {
    warnings,
    types: origins.size,
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
