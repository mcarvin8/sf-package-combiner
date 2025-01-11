import { PackageTypeObject } from './types.js';
import { ensureArray } from './ensureArray.js';

export function mergeType(
  existingTypes: PackageTypeObject[],
  type: { name: string; members: string | string[] }
): void {
  const typeName = type.name.toLowerCase();
  const members = ensureArray(type.members);

  const existingType = existingTypes.find((t) => t.name === typeName);
  if (existingType) {
    existingType.members = [...new Set([...existingType.members, ...members])];
  } else {
    existingTypes.push({ name: typeName, members });
  }
}
