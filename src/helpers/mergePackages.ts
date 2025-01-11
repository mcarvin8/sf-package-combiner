import { PackageXmlObject } from './types.js';
import { mergeType } from './mergeType.js';
import { ensureArray } from './ensureArray.js';

export function mergePackages(packageContents: PackageXmlObject[], apiVersion: string): PackageXmlObject {
  const mergedPackage: PackageXmlObject = { Package: { types: [], version: apiVersion } };

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
