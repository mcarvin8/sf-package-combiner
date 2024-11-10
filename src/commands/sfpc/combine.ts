import { writeFile } from 'node:fs/promises';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

import { SalesforcePackageXml, SfpcCombineResult } from '../../helpers/types.js';
import { buildPackage } from '../../helpers/buildPackage.js';
import { readPackageFiles } from '../../helpers/readPackageFiles.js';

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
    let packageContents: SalesforcePackageXml[] = [];
    let apiVersions: string[] = [];
    let warnings: string[] = [];

    // Load XML content from each file
    const result = await readPackageFiles(files);
    packageContents = result.packageContents;
    apiVersions = result.apiVersions;
    warnings = result.warnings;

    // Print warnings if any
    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.warn(warning);
      });
    }

    const xmlString = buildPackage(packageContents, apiVersions);
    this.log(`Combined package.xml written to: ${combinedPackage}`);
    await writeFile(combinedPackage, xmlString);
    return { path: combinedPackage };
  }
}
