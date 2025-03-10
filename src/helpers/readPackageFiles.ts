import { ManifestResolver } from '@salesforce/source-deploy-retrieve';

import { PackageXmlObject } from './types.js';

export async function readPackageFiles(
  files: string[] | null
): Promise<{ packageContents: PackageXmlObject[]; apiVersions: string[]; warnings: string[] }> {
  const warnings: string[] = [];
  const packageContents: PackageXmlObject[] = [];
  const apiVersions: string[] = [];
  const resolver = new ManifestResolver();

  if (files) {
    const promises = files.map(async (filePath) => {
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
        const parsedPackage: PackageXmlObject = {
          Package: {
            types: Array.from(metadataTypes.entries()).map(([name, members]) => ({
              name,
              members,
            })),
          },
        };

        packageContents.push(parsedPackage);
      } catch (error) {
        warnings.push(`Invalid or empty package.xml: ${filePath}`);
      }
    });

    await Promise.all(promises);
  }

  return { packageContents, apiVersions, warnings };
}
