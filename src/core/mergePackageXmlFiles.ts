import { ComponentSet, PackageManifestObject } from '@salesforce/source-deploy-retrieve';
import { sfXmlns } from '../utils/constants.js';
import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';
import { mapLimit } from '../utils/mapLimit.js';
import { determineApiVersion } from './determineApiVersion.js';
import { MergePackageResult } from './types.js';
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
  // type -> member -> source files that contained it
  const origins = new Map<string, Map<string, string[]>>();

  if (files) {
    await mapLimit(files, concurrencyLimit, async (filePath: string) => {
      try {
        const componentSet = await ComponentSet.fromManifest({ manifestPath: filePath });
        if (componentSet.size === 0) {
          warnings.push(`Invalid or empty package.xml: ${filePath}`);
          return;
        }

        for (const component of componentSet.toArray()) {
          const typeName = component.type.name;
          const memberName = component.fullName;
          const members = origins.get(typeName) ?? new Map<string, string[]>();
          origins.set(typeName, members);
          const sourceFiles = members.get(memberName) ?? [];
          members.set(memberName, sourceFiles);
          sourceFiles.push(filePath);
        }

        const version = componentSet.sourceApiVersion;
        // Stryker disable next-line ConditionalExpression,LogicalOperator -- null/undefined version doesn't affect max computation in determineApiVersion
        if (version && !apiVersions.includes(version)) {
          apiVersions.push(version);
        }
      } catch (err) {
        const sdrMessage = err instanceof Error ? err.message : String(err);
        warnings.push(`Invalid or empty package.xml: ${filePath}. [SDR] ${sdrMessage}`);
      }
    });
  }

  const { duplicates, duplicatesRemoved, membersByType, totalMembers } = summarizeOrigins(origins);
  const version = determineApiVersion(apiVersions, userApiVersion, noApiVersion);

  if (!dryRun) {
    const packageContents: PackageManifestObject = {
      Package: {
        '@_xmlns': sfXmlns,
        types: Array.from(origins.entries())
          .map(([name, members]) => ({
            members: Array.from(members.keys()).sort((a, b) => a.localeCompare(b)),
            name,
          }))
          .sort(sortTypesWithCustomObjectFirst),
        version,
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

export const CUSTOM_OBJECT_TYPE = 'CustomObject';

export function sortTypesWithCustomObjectFirst(a: { name: string }, b: { name: string }): number {
  if (a.name === CUSTOM_OBJECT_TYPE && b.name !== CUSTOM_OBJECT_TYPE) return -1;
  if (a.name !== CUSTOM_OBJECT_TYPE && b.name === CUSTOM_OBJECT_TYPE) return 1;
  return a.name.localeCompare(b.name);
}

function summarizeOrigins(origins: Map<string, Map<string, string[]>>): {
  duplicates: Array<{ type: string; member: string; files: string[] }>;
  duplicatesRemoved: number;
  membersByType: Record<string, number>;
  totalMembers: number;
} {
  const duplicates: Array<{ type: string; member: string; files: string[] }> = [];
  const membersByType: Record<string, number> = {};
  let duplicatesRemoved = 0;
  let totalMembers = 0;

  for (const [typeName, members] of origins.entries()) {
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
