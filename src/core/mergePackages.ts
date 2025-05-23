import { PackageManifestObject } from '@salesforce/source-deploy-retrieve';
import { ensureArray } from '../utils/ensureArray.js';
import { mergeType } from './mergeType.js';

export function mergePackages(packageContents: PackageManifestObject[], apiVersion: string): PackageManifestObject {
  const mergedPackage: PackageManifestObject = { Package: { types: [], version: apiVersion } };

  for (const pkg of packageContents) {
    if (!pkg.Package?.types) continue;

    const types = ensureArray(pkg.Package.types);
    for (const type of types) {
      mergeType(mergedPackage.Package.types, type);
    }
  }

  mergedPackage.Package.types.sort((a, b) => a.name.localeCompare(b.name));
  return mergedPackage;
}
