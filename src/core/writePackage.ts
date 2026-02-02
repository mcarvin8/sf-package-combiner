import { writeFile } from 'node:fs/promises';
import { XMLBuilder } from 'fast-xml-parser';
import { PackageManifestObject } from '@salesforce/source-deploy-retrieve';

import { xmlConf } from '../utils/constants.js';

export async function writePackage(packageXmlObject: PackageManifestObject, combinedPackage: string): Promise<void> {
  const builder = new XMLBuilder(xmlConf);
  let xmlContent = builder.build(packageXmlObject);

  if (packageXmlObject.Package.version === '0.0') {
    xmlContent = xmlContent.replace(/^\s*<version>0\.0<\/version>\s*\r?\n?/gm, '');
  }

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  await writeFile(combinedPackage, xmlHeader + xmlContent);
}
