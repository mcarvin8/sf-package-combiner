import { Messages } from '@salesforce/core';
import { Flags, SfCommand } from '@salesforce/sf-plugins-core';

import { combinePackages } from '../../core/combinePackages.js';
import { SfpcCombineResult } from '../../core/types.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-package-combiner', 'sfpc.combine');

export default class SfpcCombine extends SfCommand<SfpcCombineResult> {
  public static override readonly summary = messages.getMessage('summary');
  public static override readonly description = messages.getMessage('description');
  public static override readonly examples = messages.getMessages('examples');

  public static override readonly flags = {
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
    }),
    'no-api-version': Flags.boolean({
      summary: messages.getMessage('flags.no-api-version.summary'),
      char: 'n',
      default: false,
    }),
    'dry-run': Flags.boolean({
      summary: messages.getMessage('flags.dry-run.summary'),
      default: false,
    }),
  };

  public async run(): Promise<SfpcCombineResult> {
    const { flags } = await this.parse(SfpcCombine);

    const result = await combinePackages({
      packageFiles: flags['package-file'],
      combinedPackage: flags['combined-package'],
      directories: flags['directory'],
      userApiVersion: flags['api-version'],
      noApiVersion: flags['no-api-version'],
      dryRun: flags['dry-run'],
      warn: this.warn.bind(this),
    });

    this.logSummary(result);
    return result;
  }

  private logSummary(result: SfpcCombineResult): void {
    this.log(`Input files: ${result.filesProcessed}`);
    this.log('');
    this.log(`Metadata Types: ${result.types}`);
    this.log(`Members: ${result.members}`);
    this.log('');
    this.log(`Duplicate members removed: ${result.duplicatesRemoved}`);
    this.log(`API Version: ${result.apiVersion}`);

    if (result.duplicates.length > 0) {
      this.log('');
      this.log('Duplicates:');
      for (const duplicate of result.duplicates) {
        this.log(`  ${duplicate.type}: ${duplicate.member}`);
        for (const file of duplicate.files) {
          this.log(`    ${file}`);
        }
      }
    }

    this.log('');
    this.log(`${result.dryRun ? 'Output would contain' : 'Output contains'}:`);
    for (const [type, count] of Object.entries(result.membersByType).sort(([a], [b]) => a.localeCompare(b))) {
      this.log(`  ${type} ...... ${count}`);
    }

    this.log('');
    if (result.dryRun) {
      this.log('No file written.');
    } else {
      this.log(`Combined package.xml written to: ${result.path}`);
    }
  }
}
