import { ComponentSet, PackageManifestObject } from '@salesforce/source-deploy-retrieve';
import { mapLimit } from 'async';
import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';

export async function readPackageFiles(
  files: string[] | null
): Promise<{ packageContents: PackageManifestObject; apiVersions: string[]; warnings: string[] }> {
  const warnings: string[] = [];
  const apiVersions: string[] = [];
  const concurrencyLimit = getConcurrencyThreshold();

  if (!files) {
    return {
      packageContents: {
        Package: {
          types: [],
          version: '0.0',
        },
      },
      apiVersions,
      warnings,
    };
  }

  const combinedSet = new ComponentSet();

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

  const metadataTypes = groupComponentsByType(combinedSet.toArray());

  const version = apiVersions[0] ?? '0.0';
  const packageContents: PackageManifestObject = {
    Package: {
      types: Array.from(metadataTypes.entries())
        .map(([name, members]) => ({
          name,
          members: Array.from(new Set(members)).sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      version,
    },
  };

  return { packageContents, apiVersions, warnings };
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
