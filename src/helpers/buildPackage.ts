import { XMLBuilder } from 'fast-xml-parser';

import { PackageXmlObject } from './types.js';
import { sfXmlns } from './constants.js';

const xmlConf = {
  format: true,
  indentBy: '    ',
  suppressEmptyNode: false,
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
};

export function buildPackage(
  packageContents: PackageXmlObject[],
  apiVersions: string[],
  userApiVersion: number | null
): string {
  // If user does not provide an API version flag, determine the maximum API version from the apiVersions array
  let apiVersion: string;
  if (userApiVersion === null || userApiVersion < 0) {
    apiVersion = apiVersions.reduce((max, version) => (version > max ? version : max), '0.0');
  } else {
    apiVersion = userApiVersion.toFixed(1);
  }

  // Combine the parsed package.xml contents
  const mergedPackage: PackageXmlObject = { Package: { types: [], version: apiVersion } };

  // Process each parsed package XML
  for (const pkg of packageContents) {
    if (pkg.Package?.types) {
      // Ensure 'types' is always treated as an array
      const types = Array.isArray(pkg.Package.types) ? pkg.Package.types : [pkg.Package.types];
      for (const type of types) {
        const typeName = type.name;
        const lowerTypeName = typeName.toLowerCase();
        const members = Array.isArray(type.members) ? type.members : [type.members];

        const existingType = mergedPackage.Package.types.find((t) => t.name === lowerTypeName);
        if (existingType) {
          // Merge members, removing duplicates
          existingType.members = [...new Set([...existingType.members, ...members])];
        } else {
          mergedPackage.Package.types.push({ name: lowerTypeName, members });
        }
      }
    }
  }
  mergedPackage.Package.types.sort((a, b) => a.name.localeCompare(b.name));

  // Construct the XML data as a JSON-like object
  const packageXmlObject: PackageXmlObject = {
    Package: {
      '@_xmlns': sfXmlns,
      types: mergedPackage.Package.types.map((type) => ({
        members: type.members.sort((a, b) => a.localeCompare(b)),
        name: type.name,
      })),
      version: apiVersion !== '0.0' ? apiVersion : undefined,
    },
  };

  // Build the XML string
  const builder = new XMLBuilder(xmlConf);
  let xmlContent = builder.build(packageXmlObject) as string;

  // Ensure formatting for an empty package
  if (mergedPackage.Package.types.length === 0) {
    xmlContent = xmlContent.replace(
      `<Package xmlns="${sfXmlns}"></Package>`,
      `<Package xmlns="${sfXmlns}">\n\n</Package>`
    );
  }

  // Prepend the XML declaration manually
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  return xmlHeader + xmlContent;
}
