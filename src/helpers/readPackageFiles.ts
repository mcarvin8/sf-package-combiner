import { ManifestResolver, PackageManifestObject } from '@salesforce/source-deploy-retrieve';
import { mapLimit } from 'async';

import { getConcurrencyThreshold } from './getConcurrencyThreshold.js';

export async function readPackageFiles(
  files: string[] | null
): Promise<{ packageContents: PackageManifestObject[]; apiVersions: string[]; warnings: string[] }> {
  const warnings: string[] = [];
  const packageContents: PackageManifestObject[] = [];
  const apiVersions: string[] = [];
  const resolver = new ManifestResolver();
  const concurrencyLimit = getConcurrencyThreshold();

  if (files) {
    await mapLimit(files, concurrencyLimit, async (filePath: string) => {
      try {
        // Resolve the manifest file using SDR, which ensures it's a valid package.xml
        const resolvedManifest = await resolver.resolve(filePath);

        if (!resolvedManifest || resolvedManifest.components.length === 0) {
          warnings.push(`Invalid or empty package.xml: ${filePath}`);
          return;
        }

        // push api version to array if found
        if (resolvedManifest.apiVersion) {
          apiVersions.push(resolvedManifest.apiVersion);
        }

        // Extract metadata components and API versions
        const metadataTypes = new Map<string, string[]>(); // Type -> Full Names

        for (const component of resolvedManifest.components) {
          if (!metadataTypes.has(component.type.name)) {
            metadataTypes.set(component.type.name, []);
          }
          metadataTypes.get(component.type.name)!.push(component.fullName);
        }

        // Construct parsed package object
        const parsedPackage: PackageManifestObject = {
          Package: {
            types: Array.from(metadataTypes.entries()).map(([name, members]) => ({
              name,
              members,
            })),
            version: resolvedManifest.apiVersion,
          },
        };

        packageContents.push(parsedPackage);
      } catch (error) {
        warnings.push(`Invalid or empty package.xml: ${filePath}`);
      }
    });
  }

  return { packageContents, apiVersions, warnings };
}
