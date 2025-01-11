import { XMLBuilder } from 'fast-xml-parser';

import { PackageXmlObject } from './types.js';
import { sfXmlns, xmlConf } from './constants.js';
import { determineApiVersion } from './determineApiVersion.js';
import { mergePackages } from './mergePackages.js';

export function buildPackage(
  packageContents: PackageXmlObject[],
  apiVersions: string[],
  userApiVersion: string | null,
  noApiVersion: boolean
): string {
  const apiVersion = determineApiVersion(apiVersions, userApiVersion, noApiVersion);
  const mergedPackage = mergePackages(packageContents, apiVersion);
  const packageXmlObject = constructPackageXmlObject(mergedPackage, apiVersion);

  return generateXmlString(packageXmlObject, mergedPackage);
}

function generateXmlString(packageXmlObject: PackageXmlObject, mergedPackage: PackageXmlObject): string {
  const builder = new XMLBuilder(xmlConf);
  let xmlContent = builder.build(packageXmlObject) as string;

  if (mergedPackage.Package.types.length === 0) {
    xmlContent = xmlContent.replace(
      `<Package xmlns="${sfXmlns}"></Package>`,
      `<Package xmlns="${sfXmlns}">\n\n</Package>`
    );
  }

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  return xmlHeader + xmlContent;
}

function constructPackageXmlObject(mergedPackage: PackageXmlObject, apiVersion: string): PackageXmlObject {
  const sortedTypes = mergedPackage.Package.types.map((type) => ({
    members: [...type.members].sort((a: string, b: string) => a.localeCompare(b)),
    name: type.name,
  }));

  return {
    Package: {
      '@_xmlns': sfXmlns,
      types: sortedTypes,
      version: apiVersion !== '0.0' ? apiVersion : undefined,
    },
  };
}
