import { writeFile } from 'node:fs/promises';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { PackageManifestObject } from '@salesforce/source-deploy-retrieve';

import { buildPackage } from '../../helpers/buildPackage.js';
import { readPackageFiles } from '../../helpers/readPackageFiles.js';
import { findFilesInDirectory } from '../../helpers/findFilesinDirectory.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-package-combiner', 'sfpc.combine');

export type SfpcCombineResult = {
  path: string;
};

export default class SfpcCombine extends SfCommand<SfpcCombineResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'package-file': Flags.file({
      summary: messages.getMessage('flags.package-file.summary'),
      char: 'f',
      multiple: true,
    }),
    'combined-package': Flags.file({
      summary: messages.getMessage('flags.combined-package.summary'),
      char: 'c',
      exists: false,
      default: 'package.xml',
    }),
    directory: Flags.directory({
      summary: messages.getMessage('flags.directory.summary'),
      char: 'd',
      multiple: true,
    }),
    'api-version': Flags.orgApiVersion({
      summary: messages.getMessage('flags.api-version.summary'),
      char: 'v',
      required: false,
      multiple: false,
    }),
    'no-api-version': Flags.boolean({
      summary: messages.getMessage('flags.no-api-version.summary'),
      char: 'n',
      required: false,
      default: false,
    }),
  };

  public async run(): Promise<SfpcCombineResult> {
    const { flags } = await this.parse(SfpcCombine);

    const files = flags['package-file'] ?? [];
    const combinedPackage = flags['combined-package'];
    const directories = flags['directory'] ?? null;
    const userApiVersion = flags['api-version'] ?? null;
    const noApiVersion = flags['no-api-version'];
    let packageContents: PackageManifestObject[] = [];
    let apiVersions: string[] = [];
    const warnings: string[] = [];

    // Search directories for XML files
    // Process directories to find XML files
    if (directories && directories.length > 0) {
      const { files: dirFiles, warnings: dirWarnings } = await findFilesInDirectory(directories);
      files.push(...dirFiles);
      warnings.push(...dirWarnings);
    }

    // Load XML content from each file
    const result = await readPackageFiles(files);
    packageContents = result.packageContents;
    apiVersions = result.apiVersions;
    warnings.push(...result.warnings);

    // Print warnings if any
    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.warn(warning);
      });
    }

    const xmlString = buildPackage(packageContents, apiVersions, userApiVersion, noApiVersion);
    this.log(`Combined package.xml written to: ${combinedPackage}`);
    await writeFile(combinedPackage, xmlString);
    return { path: combinedPackage };
  }
}
