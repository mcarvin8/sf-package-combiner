/* eslint-disable no-await-in-loop */
import { readFile } from 'node:fs/promises';

import { parsePackageXml } from './parsePackage.js';
import { PackageXmlObject } from './types.js';

export async function readPackageFiles(
  files: string[] | null
): Promise<{ packageContents: PackageXmlObject[]; apiVersions: string[]; warnings: string[] }> {
  const warnings: string[] = [];
  const packageContents: PackageXmlObject[] = [];
  const apiVersions: string[] = [];
  if (files) {
    for (const filePath of files) {
      try {
        const fileContent = await readFile(filePath, 'utf-8');
        const parsed = parsePackageXml(fileContent);
        if (parsed) {
          packageContents.push(parsed);
          // Add the package version to the apiVersions array
          if (parsed.Package?.version) {
            apiVersions.push(parsed.Package.version);
          }
        } else {
          warnings.push(`File ${filePath} does not match expected Salesforce package structure.`);
        }
      } catch (error) {
        warnings.push(`Error reading or parsing file ${filePath}`);
      }
    }
  }

  return { packageContents, apiVersions, warnings };
}
