import { writeFile } from 'node:fs/promises';
import XMLBuilder from 'fast-xml-builder';

import { xmlConf } from '../utils/constants.js';
import { PackageManifestObject } from './types.js';

export async function writePackage(packageXmlObject: PackageManifestObject, combinedPackage: string): Promise<void> {
  const builder = new XMLBuilder(xmlConf);
  const xmlContent = builder.build(packageXmlObject);

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  await writeFile(combinedPackage, xmlHeader + xmlContent);
}
