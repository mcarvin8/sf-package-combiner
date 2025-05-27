import { writeFile } from 'node:fs/promises';
import { XMLBuilder } from 'fast-xml-parser';
import { PackageManifestObject } from '@salesforce/source-deploy-retrieve';

import { sfXmlns, xmlConf } from '../utils/constants.js';

export async function writePackage(packageXmlObject: PackageManifestObject, combinedPackage: string): Promise<void> {
  const builder = new XMLBuilder(xmlConf);
  let xmlContent = builder.build(packageXmlObject) as string;

  if (Array.isArray(packageXmlObject.Package.types) && packageXmlObject.Package.types.length === 0) {
    xmlContent = xmlContent.replace(
      `<Package xmlns="${sfXmlns}"></Package>`,
      `<Package xmlns="${sfXmlns}">\n\n</Package>`
    );
  }

  if (packageXmlObject.Package.version === '0.0') {
    xmlContent = xmlContent.replace(/^\s*<version>0\.0<\/version>\s*\r?\n?/gm, '');
  }

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  await writeFile(combinedPackage, xmlHeader + xmlContent);
}
