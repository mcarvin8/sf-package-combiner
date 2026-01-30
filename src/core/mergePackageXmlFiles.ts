import { ComponentSet, PackageManifestObject } from '@salesforce/source-deploy-retrieve';
import { mapLimit } from 'async';
import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';
import { sfXmlns } from '../utils/constants.js';
import { determineApiVersion } from './determineApiVersion.js';
import { writePackage } from './writePackage.js';

export async function mergePackageXmlFiles(
  files: string[] | null,
  combinedPackage: string,
  userApiVersion: string | null,
  noApiVersion: boolean
): Promise<string[]> {
  const warnings: string[] = [];
  const apiVersions: string[] = [];
  const concurrencyLimit = getConcurrencyThreshold();
  const combinedSet = new ComponentSet();

  if (files) {
    await mapLimit(files, concurrencyLimit, async (filePath: string) => {
      try {
        const componentSet = await ComponentSet.fromManifest({ manifestPath: filePath });
        if (componentSet.size === 0) {
          warnings.push(`Invalid or empty package.xml: ${filePath}`);
          return;
        }

        for (const component of componentSet.toArray()) {
          combinedSet.add(component);
        }

        const version = componentSet.sourceApiVersion;
        if (version && !apiVersions.includes(version)) {
          apiVersions.push(version);
        }
      } catch {
        warnings.push(`Invalid or empty package.xml: ${filePath}`);
      }
    });
  }

  const metadataTypes = groupComponentsByType(combinedSet.toArray());

  const version = determineApiVersion(apiVersions, userApiVersion, noApiVersion);
  const packageContents: PackageManifestObject = {
    Package: {
      '@_xmlns': sfXmlns,
      types: Array.from(metadataTypes.entries())
        .map(([name, members]) => ({
          members: Array.from(new Set(members)).sort((a, b) => a.localeCompare(b)),
          name,
        }))
        .sort(sortTypesWithCustomObjectFirst),
      version,
    },
  };
  await writePackage(packageContents, combinedPackage);
  return warnings;
}

const CUSTOM_OBJECT_TYPE = 'CustomObject';

function sortTypesWithCustomObjectFirst(a: { name: string }, b: { name: string }): number {
  if (a.name === CUSTOM_OBJECT_TYPE && b.name !== CUSTOM_OBJECT_TYPE) return -1;
  if (a.name !== CUSTOM_OBJECT_TYPE && b.name === CUSTOM_OBJECT_TYPE) return 1;
  return a.name.localeCompare(b.name);
}

function groupComponentsByType(components: ReturnType<ComponentSet['toArray']>): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const component of components) {
    const typeName = component.type.name;
    if (!map.has(typeName)) {
      map.set(typeName, []);
    }
    map.get(typeName)!.push(component.fullName);
  }
  return map;
}
