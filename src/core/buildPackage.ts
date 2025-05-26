import { XMLBuilder } from 'fast-xml-parser';
import { PackageManifestObject } from '@salesforce/source-deploy-retrieve';

import { sfXmlns, xmlConf } from '../utils/constants.js';
import { determineApiVersion } from './determineApiVersion.js';

export function buildPackage(
  packageContents: PackageManifestObject[],
  apiVersions: string[],
  userApiVersion: string | null,
  noApiVersion: boolean
): string {
  const apiVersion = determineApiVersion(apiVersions, userApiVersion, noApiVersion);

  const mergedPackage = packageContents[0] ?? {
    Package: { types: [], version: apiVersion },
  };

  const packageXmlObject = constructPackageManifestObject(mergedPackage, apiVersion);

  return generateXmlString(packageXmlObject, mergedPackage);
}

function generateXmlString(packageXmlObject: PackageManifestObject, mergedPackage: PackageManifestObject): string {
  const builder = new XMLBuilder(xmlConf);
  let xmlContent = builder.build(packageXmlObject) as string;

  if (mergedPackage.Package.types.length === 0) {
    xmlContent = xmlContent.replace(
      `<Package xmlns="${sfXmlns}"></Package>`,
      `<Package xmlns="${sfXmlns}">\n\n</Package>`
    );
  }

  // eslint-disable-next-line no-console
  console.log(mergedPackage.Package.version);
  if (mergedPackage.Package.version === '0.0' || !mergedPackage.Package.version) {
    xmlContent = xmlContent.replace(/^\s*<version>0\.0<\/version>\s*\r?\n?/gm, '');
  }

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  return xmlHeader + xmlContent;
}

function constructPackageManifestObject(
  mergedPackage: PackageManifestObject,
  apiVersion: string
): PackageManifestObject {
  const sortedTypes = mergedPackage.Package.types.map((type) => ({
    members: [...type.members].sort((a: string, b: string) => a.localeCompare(b)),
    name: type.name,
  }));

  return {
    Package: {
      '@_xmlns': sfXmlns,
      types: sortedTypes,
      version: apiVersion !== '0.0' ? apiVersion : '0.0',
    },
  };
}
