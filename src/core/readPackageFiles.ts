import { ManifestResolver, PackageManifestObject } from '@salesforce/source-deploy-retrieve';
import { mapLimit } from 'async';

import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';

export async function readPackageFiles(
  files: string[] | null
): Promise<{ packageContents: PackageManifestObject[]; apiVersions: string[]; warnings: string[] }> {
  const warnings: string[] = [];
  const packageContents: PackageManifestObject[] = [];
  const apiVersions: string[] = [];
  const resolver = new ManifestResolver();
  const concurrencyLimit = getConcurrencyThreshold();

  if (!files) {
    return { packageContents, apiVersions, warnings };
  }

  await mapLimit(files, concurrencyLimit, async (filePath: string) => {
    try {
      const result = await parsePackageFile(resolver, filePath);
      if (result) {
        packageContents.push(result.package);
        if (result.apiVersion) {
          apiVersions.push(result.apiVersion);
        }
      } else {
        warnings.push(`Invalid or empty package.xml: ${filePath}`);
      }
    } catch {
      warnings.push(`Invalid or empty package.xml: ${filePath}`);
    }
  });

  return { packageContents, apiVersions, warnings };
}

async function parsePackageFile(
  resolver: ManifestResolver,
  filePath: string
): Promise<{ package: PackageManifestObject; apiVersion?: string } | null> {
  const resolvedManifest = await resolver.resolve(filePath);

  if (!resolvedManifest || resolvedManifest.components.length === 0) {
    return null;
  }

  const metadataTypes = groupComponentsByType(resolvedManifest.components);

  const parsedPackage: PackageManifestObject = {
    Package: {
      types: Array.from(metadataTypes.entries()).map(([name, members]) => ({
        name,
        members,
      })),
      version: resolvedManifest.apiVersion,
    },
  };

  return { package: parsedPackage, apiVersion: resolvedManifest.apiVersion };
}

function groupComponentsByType(components: Array<{ type: { name: string }; fullName: string }>): Map<string, string[]> {
  const metadataTypes = new Map<string, string[]>();
  for (const component of components) {
    if (!metadataTypes.has(component.type.name)) {
      metadataTypes.set(component.type.name, []);
    }
    metadataTypes.get(component.type.name)!.push(component.fullName);
  }
  return metadataTypes;
}
