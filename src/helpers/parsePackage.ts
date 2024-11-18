/* eslint-disable no-await-in-loop */
import { XMLParser } from 'fast-xml-parser';

import { PackageXmlObject } from './types.js';
import { sfXmlns } from './constants.js';

const XML_PARSER_OPTION = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  parseNodeValue: false,
  parseAttributeValue: false,
  trimValues: true,
};

export function parsePackageXml(xmlContent: string): PackageXmlObject | null {
  try {
    const parser = new XMLParser(XML_PARSER_OPTION);

    // Parse the XML string to an object
    const parsed = parser.parse(xmlContent, true) as unknown as PackageXmlObject;

    // Ensure the root <Package> exists and is of correct type
    if (!parsed || typeof parsed !== 'object' || !parsed.Package) {
      return null;
    }

    const packageData = parsed.Package as Partial<PackageXmlObject['Package']>;

    // Validate and normalize the <types> field
    if (!packageData.types) {
      return null;
    }
    const allowedKeys = new Set(['types', 'version', '@_xmlns']);
    const packageKeys = Object.keys(parsed.Package);
    const hasUnexpectedKeys = packageKeys.some((key) => !allowedKeys.has(key));
    if (hasUnexpectedKeys) {
      return null;
    }
    const normalizedTypes = Array.isArray(packageData.types) ? packageData.types : [packageData.types];

    packageData.types = normalizedTypes.map((type): { name: string; members: string[] } => {
      if (!type || typeof type !== 'object' || typeof type.name !== 'string') {
        throw new Error('Invalid <types> block: Missing or invalid <name> element.');
      }
      // Validate that only "name" and "members" keys are present
      const allowedTypesKeys = new Set(['name', 'members']);
      const typeKeys = Object.keys(type);
      const hasUnexpectedTypesKeys = typeKeys.some((key) => !allowedTypesKeys.has(key));
      if (hasUnexpectedTypesKeys) {
        throw new Error('Invalid package.xml: Each <types> block must contain only <name> and <members> tags.');
      }
      // Ensure members is always a string array
      let members: string[];

      if (Array.isArray(type.members)) {
        members = type.members.filter((member): member is string => typeof member === 'string');
      } else if (typeof type.members === 'string') {
        members = [type.members];
      } else {
        members = [];
      }

      return {
        name: type.name,
        members,
      };
    });

    // Ensure a maximum of one <version> tag
    if (Array.isArray(packageData.version)) {
      if (packageData.version.length > 1) {
        return null;
      }
      packageData.version = packageData.version[0] as string;
    }

    if (packageData['@_xmlns'] !== sfXmlns) {
      return null;
    }

    // Validate the final structure
    if (isPackageXmlObject({ Package: packageData })) {
      return { Package: packageData as PackageXmlObject['Package'] };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

function isPackageXmlObject(obj: unknown): obj is PackageXmlObject {
  if (
    typeof obj !== 'object' ||
    obj === null ||
    !('Package' in obj) ||
    typeof (obj as { Package: unknown }).Package !== 'object'
  ) {
    return false;
  }

  const packageData = (obj as { Package: unknown }).Package as Partial<PackageXmlObject['Package']>;

  if (
    !Array.isArray(packageData.types) ||
    !packageData.types.every(
      (type) =>
        typeof type === 'object' &&
        type !== null &&
        typeof type.name === 'string' &&
        Array.isArray(type.members) &&
        type.members.every((member) => typeof member === 'string')
    )
  ) {
    return false;
  }

  if (packageData.version && typeof packageData.version !== 'string') {
    return false;
  }

  return true;
}
