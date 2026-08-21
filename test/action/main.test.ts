import * as core from '@actions/core';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { run } from '../../src/action/main.js';
import { combinePackages } from '../../src/core/combinePackages.js';

vi.mock('@actions/core');
vi.mock('../../src/core/combinePackages.js');

const combineMock = combinePackages as unknown as Mock;
const getInputMock = core.getInput as unknown as Mock;
const getMultilineInputMock = core.getMultilineInput as unknown as Mock;
const getBooleanInputMock = core.getBooleanInput as unknown as Mock;

function stubInputs(
  inputs: Record<string, string>,
  multilineInputs: Record<string, string[]> = {},
  booleanInputs: Record<string, boolean> = {},
): void {
  getInputMock.mockImplementation((name: string) => inputs[name] ?? '');
  getMultilineInputMock.mockImplementation((name: string) => multilineInputs[name] ?? []);
  getBooleanInputMock.mockImplementation((name: string) => booleanInputs[name] ?? false);
}

const baseResult = {
  path: 'package.xml',
  dryRun: false,
  filesProcessed: 2,
  types: 1,
  members: 1,
  duplicatesRemoved: 0,
  duplicates: [],
  membersByType: { ApexClass: 1 },
  apiVersion: '60.0',
};

describe('GitHub Action entrypoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps inputs to combinePackages, trimming/filtering multiline values and defaulting empty api-version to null', async () => {
    stubInputs(
      { 'combined-package': 'out.xml', 'api-version': '' },
      { 'package-file': ['  package1.xml  ', '', 'package2.xml'], directory: ['  dir1  '] },
      { 'no-api-version': false, 'dry-run': false, 'fail-on-empty': false },
    );
    combineMock.mockResolvedValue(baseResult);

    await run();

    expect(combineMock).toHaveBeenCalledWith({
      packageFiles: ['package1.xml', 'package2.xml'],
      combinedPackage: 'out.xml',
      directories: ['dir1'],
      userApiVersion: null,
      noApiVersion: false,
      dryRun: false,
      warn: expect.any(Function),
    });
    expect(getBooleanInputMock).toHaveBeenCalledWith('no-api-version');
    expect(getBooleanInputMock).toHaveBeenCalledWith('dry-run');
    expect(getBooleanInputMock).toHaveBeenCalledWith('fail-on-empty');
  });

  it('passes through a non-empty api-version input', async () => {
    stubInputs({ 'api-version': '61.0' }, { 'package-file': ['package1.xml'] });
    combineMock.mockResolvedValue(baseResult);

    await run();

    expect(combineMock).toHaveBeenCalledWith(expect.objectContaining({ userApiVersion: '61.0' }));
  });

  it('defaults combined-package to package.xml when the input is empty', async () => {
    stubInputs({ 'combined-package': '' }, { 'package-file': ['package1.xml'] });
    combineMock.mockResolvedValue(baseResult);

    await run();

    expect(combineMock).toHaveBeenCalledWith(expect.objectContaining({ combinedPackage: 'package.xml' }));
  });

  it('sets outputs and logs the written path on success', async () => {
    stubInputs({}, { 'package-file': ['package1.xml'] });
    combineMock.mockResolvedValue(baseResult);

    await run();

    expect(core.setOutput).toHaveBeenCalledWith('combined-package-path', 'package.xml');
    expect(core.setOutput).toHaveBeenCalledWith('files-processed', 2);
    expect(core.setOutput).toHaveBeenCalledWith('types', 1);
    expect(core.setOutput).toHaveBeenCalledWith('members', 1);
    expect(core.setOutput).toHaveBeenCalledWith('duplicates-removed', 0);
    expect(core.setOutput).toHaveBeenCalledWith('api-version', '60.0');
    expect(core.setOutput).toHaveBeenCalledWith('warnings', '');
    expect(core.info).toHaveBeenCalledWith('Combined package.xml written to: package.xml');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('reports an empty api-version output when omitted', async () => {
    stubInputs({}, { 'package-file': ['package1.xml'] });
    combineMock.mockResolvedValue({ ...baseResult, apiVersion: undefined });

    await run();

    expect(core.setOutput).toHaveBeenCalledWith('api-version', '');
  });

  it('reports an empty combined-package-path output and logs a dry-run message', async () => {
    stubInputs({}, { 'package-file': ['package1.xml'] }, { 'dry-run': true });
    combineMock.mockResolvedValue({ ...baseResult, path: null, dryRun: true });

    await run();

    expect(core.setOutput).toHaveBeenCalledWith('combined-package-path', '');
    expect(core.info).toHaveBeenCalledWith('Dry run: no file written.');
  });

  it('propagates warnings from the warn callback to core.warning and the warnings output', async () => {
    stubInputs({}, { 'package-file': ['package1.xml'] });
    combineMock.mockImplementation(async ({ warn }: { warn: (msg: string) => void }) => {
      warn('first warning');
      warn('second warning');
      return baseResult;
    });

    await run();

    expect(core.warning).toHaveBeenCalledWith('first warning');
    expect(core.warning).toHaveBeenCalledWith('second warning');
    expect(core.setOutput).toHaveBeenCalledWith('warnings', 'first warning\nsecond warning');
  });

  it('fails the action when fail-on-empty is true and the combined package has no types', async () => {
    stubInputs({}, { 'package-file': ['package1.xml'] }, { 'fail-on-empty': true });
    combineMock.mockResolvedValue({ ...baseResult, types: 0 });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(
      'The combined package.xml has no <types> -- every input was invalid or empty.',
    );
  });

  it('does not fail when fail-on-empty is false even if the combined package has no types', async () => {
    stubInputs({}, { 'package-file': ['package1.xml'] }, { 'fail-on-empty': false });
    combineMock.mockResolvedValue({ ...baseResult, types: 0 });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('does not fail when fail-on-empty is true but the combined package has types', async () => {
    stubInputs({}, { 'package-file': ['package1.xml'] }, { 'fail-on-empty': true });
    combineMock.mockResolvedValue({ ...baseResult, types: 1 });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('fails the action with the error message when combinePackages throws', async () => {
    stubInputs({}, { 'package-file': ['package1.xml'] });
    combineMock.mockRejectedValue(new Error('boom'));

    await run();

    expect(core.setFailed).toHaveBeenCalledWith('boom');
  });

  it('fails the action with String(error) when the thrown value is not an Error instance', async () => {
    stubInputs({}, { 'package-file': ['package1.xml'] });
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    combineMock.mockRejectedValue('a plain string rejection');

    await run();

    expect(core.setFailed).toHaveBeenCalledWith('a plain string rejection');
  });
});
