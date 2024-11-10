/* eslint-disable no-await-in-loop */
import { readFile, writeFile } from 'node:fs/promises';
import { create } from 'xmlbuilder2';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

import { parsePackageXml } from '../../helpers/parsePackage.js';
import { SalesforcePackageXml, SfpcCombineResult } from '../../helpers/types.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-package-combiner', 'sfpc.combine');

export default class SfpcCombine extends SfCommand<SfpcCombineResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'package-file': Flags.file({
      summary: messages.getMessage('flags.package-file.summary'),
      char: 'f',
      multiple: true,
      exists: true,
    }),
    'combined-package': Flags.file({
      summary: messages.getMessage('flags.combined-package.summary'),
      char: 'c',
      exists: false,
      default: 'combinedPackage.xml',
    }),
  };

  public async run(): Promise<SfpcCombineResult> {
    const { flags } = await this.parse(SfpcCombine);

    const files = flags['package-file'] ?? null;
    const combinedPackage = flags['combined-package'];
    const packageContents: SalesforcePackageXml[] = [];
    const apiVersions: string[] = [];

    // Load XML content from each file
    if (files) {
      for (const filePath of files) {
        try {
          const fileContent = await readFile(filePath, 'utf-8');
          const parsed = await parsePackageXml(fileContent);
          if (parsed) {
            packageContents.push(parsed);
            // Add the package version to the apiVersions array
            if (parsed.Package?.version) {
              apiVersions.push(parsed.Package.version);
            }
          } else {
            this.warn(`File ${filePath} does not match expected Salesforce package structure.`);
          }
        } catch (error) {
          this.error(`Error reading or parsing file ${filePath}`);
        }
      }
    }

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

    const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('Package', {
      xmlns: 'http://soap.sforce.com/2006/04/metadata',
    });

    // Create <types> for each type, properly formatting the XML
    mergedPackage.Package.types.forEach((type) => {
      const typeElement = root.ele('types');
      type.members.forEach((member) => {
        typeElement.ele('members').txt(member).up();
      });
      typeElement.ele('name').txt(type.name).up();
    });

    // Set the maximum version element
    if (maxVersion !== '0.0') {
      root.ele('version').txt(maxVersion);
    }

    // Output the merged package.xml
    const xmlString = root.end({ prettyPrint: true });
    this.log(`Combined package.xml written to: ${combinedPackage}`);
    await writeFile(combinedPackage, xmlString);
    return { path: combinedPackage };
  }
}
