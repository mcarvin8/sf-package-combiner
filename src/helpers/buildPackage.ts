import { create } from 'xmlbuilder2';

import { SalesforcePackageXml } from './types.js';

const xmlConf = { indent: '    ', newline: '\n', prettyPrint: true };

export function buildPackage(packageContents: SalesforcePackageXml[], apiVersions: string[]): string {
  // Determine the maximum API version from the apiVersions array
  const maxVersion = apiVersions.reduce((max, version) => (version > max ? version : max), '0.0');

  // Combine the parsed package.xml contents
  const mergedPackage: SalesforcePackageXml = { Package: { types: [], version: maxVersion } };

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

  const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('Package', {
    xmlns: 'http://soap.sforce.com/2006/04/metadata',
  });

  // Create <types> for each type, properly formatting the XML
  if (packageContents.length > 0) {
    mergedPackage.Package.types.forEach((type) => {
      const typeElement = root.ele('types');
      type.members
        .sort((a, b) => a.localeCompare(b))
        .forEach((member) => {
          typeElement.ele('members').txt(member).up();
        });
      typeElement.ele('name').txt(type.name).up();
    });
  } else {
    root.txt('\n');
    root.txt('\n');
  }

  // Set the maximum version element
  if (maxVersion !== '0.0') {
    root.ele('version').txt(maxVersion);
  }

  // Output the merged package.xml
  return root.end(xmlConf);
}
