'use strict';

import * as core from '@actions/core';
import { combinePackages } from '../core/combinePackages.js';

function multilineInput(name: string): string[] {
  return core
    .getMultilineInput(name)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export async function run(): Promise<void> {
  try {
    const packageFiles = multilineInput('package-file');
    const directories = multilineInput('directory');
    const combinedPackage = core.getInput('combined-package') || 'package.xml';
    const apiVersionInput = core.getInput('api-version');
    const noApiVersion = core.getBooleanInput('no-api-version');
    const dryRun = core.getBooleanInput('dry-run');
    const failOnEmpty = core.getBooleanInput('fail-on-empty');
    const warnings: string[] = [];

    const result = await combinePackages({
      packageFiles,
      combinedPackage,
      directories,
      userApiVersion: apiVersionInput === '' ? null : apiVersionInput,
      noApiVersion,
      dryRun,
      warn: (msg) => warnings.push(msg),
    });

    core.setOutput('combined-package-path', result.path ?? '');
    core.setOutput('files-processed', result.filesProcessed);
    core.setOutput('types', result.types);
    core.setOutput('members', result.members);
    core.setOutput('duplicates-removed', result.duplicatesRemoved);
    core.setOutput('api-version', result.apiVersion ?? '');
    core.setOutput('warnings', warnings.join('\n'));

    warnings.forEach((warning) => core.warning(warning));

    if (result.dryRun) {
      core.info('Dry run: no file written.');
    } else {
      core.info(`Combined package.xml written to: ${result.path}`);
    }

    if (failOnEmpty && result.types === 0) {
      core.setFailed('The combined package.xml has no <types> -- every input was invalid or empty.');
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}
