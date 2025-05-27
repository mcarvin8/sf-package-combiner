import { XMLBuilder } from 'fast-xml-parser';
import { PackageManifestObject } from '@salesforce/source-deploy-retrieve';

import { sfXmlns, xmlConf } from '../utils/constants.js';
import { determineApiVersion } from './determineApiVersion.js';

export function buildPackage(
  packageContents: PackageManifestObject,
  apiVersions: string[],
  userApiVersion: string | null,
  noApiVersion: boolean
): string {
  const apiVersion = determineApiVersion(apiVersions, userApiVersion, noApiVersion);
  const finalPackage: PackageManifestObject = {
    Package: {
      '@_xmlns': sfXmlns,
      types: (packageContents.Package.types ?? []).map((type) => ({
        members: type.members,
        name: type.name,
      })),
      version: apiVersion,
    },
  };
  return generateXmlString(finalPackage);
}

function generateXmlString(packageXmlObject: PackageManifestObject): string {
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
  return xmlHeader + xmlContent;
}
