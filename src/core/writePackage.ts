import { writeFile } from 'node:fs/promises';
import { PackageManifestObject } from '@salesforce/source-deploy-retrieve';
import XMLBuilder from 'fast-xml-builder';

import { xmlConf } from '../utils/constants.js';

export async function writePackage(packageXmlObject: PackageManifestObject, combinedPackage: string): Promise<void> {
  const builder = new XMLBuilder(xmlConf);
  let xmlContent = builder.build(packageXmlObject);

  // Stryker disable next-line ConditionalExpression,EqualityOperator -- regex targets only '0.0' so if(true) is equivalent
  if (packageXmlObject.Package.version === '0.0') {
    // Stryker disable next-line Regex -- mutations are equivalent on actual XML output (leading whitespace + line endings handled correctly)
    xmlContent = xmlContent.replace(/^\s*<version>0\.0<\/version>\s*\r?\n?/gm, '');
  }

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  await writeFile(combinedPackage, xmlHeader + xmlContent);
}
