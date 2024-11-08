/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-await-in-loop */
import { Parser } from 'xml2js';

import { SalesforcePackageXml } from './types.js';

// Safe parsing function for package XML using xml2js
export async function parsePackageXml(xmlContent: string): Promise<SalesforcePackageXml | null> {
  try {
    const parser = new Parser();

    // Parse the XML string to an object
    const parsed: SalesforcePackageXml = (await parser.parseStringPromise(xmlContent)) as SalesforcePackageXml;

    // Normalize the structure if 'name' or 'version' are wrapped in arrays
    if (parsed.Package?.types) {
      parsed.Package.types.forEach((type) => {
        if (Array.isArray(type.name)) {
          type.name = type.name[0]; // Normalize to a single string if it's wrapped in an array
        }
        if (Array.isArray(type.members)) {
          type.members = type.members.flat(); // Flatten in case members are nested
        }
      });
    }

    // Handle 'version' being an array, string, or undefined
    if (parsed.Package && Array.isArray(parsed.Package.version)) {
      parsed.Package.version = parsed.Package.version[0];
    }

    // Apply a type guard to safely assert the parsed content matches SalesforcePackageXml
    if (isSalesforcePackageXml(parsed)) {
      return parsed;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

function isSalesforcePackageXml(obj: unknown): obj is SalesforcePackageXml {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'Package' in obj &&
    typeof (obj as { Package: unknown }).Package === 'object' &&
    Array.isArray((obj as { Package: { types: unknown } }).Package.types) &&
    (obj as { Package: { types: Array<{ name: unknown; members: unknown }> } }).Package.types.every(
      (type) =>
        typeof type === 'object' &&
        type !== null &&
        typeof type.name === 'string' &&
        Array.isArray(type.members) &&
        type.members.every((member) => typeof member === 'string')
    ) &&
    // Make version optional here: allow it to be a string or undefined
    (typeof (obj as { Package: { version?: unknown } }).Package.version === 'string' ||
      typeof (obj as { Package: { version?: unknown } }).Package.version === 'undefined')
  );
}
