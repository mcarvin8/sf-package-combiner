import { writeFile } from 'node:fs/promises';

import { buildXml } from '../utils/xmlBuilder.js';
import { PackageManifestObject } from './types.js';

export async function writePackage(packageXmlObject: PackageManifestObject, combinedPackage: string): Promise<void> {
  const xmlContent = buildXml(packageXmlObject);

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  await writeFile(combinedPackage, xmlHeader + xmlContent);
}
