import { strictEqual } from 'node:assert';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SfpcCombineResult } from '../../../src/core/types.js';

describe('sfpc combine NUTs', () => {
  let session: TestSession;
  const package1 = resolve('test/samples/package-account-only.xml');
  const package2 = resolve('test/samples/package-mixed-types.xml');
  const package3 = resolve('test/samples/package-custom-label.xml');
  const outputPackage = resolve('package.xml');
  const baseline = resolve('test/samples/expected-combined.xml');
  const dryRunOutputPackage = resolve('dry-run-nut-output.xml');

  beforeAll(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
  });

  afterAll(async () => {
    await session?.clean();
  });

  it('combine the valid packages together.', () => {
    const command = `sfpc combine -f ${package1} -f ${package2} -f ${package3} -c ${outputPackage}`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(output).toContain(`Combined package.xml written to: ${outputPackage}`);
  });
  it('confirm the XML files created are the same as the baselines.', async () => {
    const testPackage = await readFile(outputPackage, 'utf-8');
    const baselinePackage = await readFile(baseline, 'utf-8');
    strictEqual(testPackage, baselinePackage, `File content is different between ${outputPackage} and ${baseline}`);
  });

  it('dry-run reports the summary and writes no file.', () => {
    const command = `sfpc combine -f ${package1} -f ${package2} -f ${package3} -c ${dryRunOutputPackage} --dry-run`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(output).toContain('No file written.');
    expect(output).toContain('Duplicates:');
    expect(existsSync(dryRunOutputPackage)).toBe(false);
  });

  it('dry-run with --json returns the enriched result and a null path.', () => {
    const command = `sfpc combine -f ${package1} -f ${package2} -f ${package3} -c ${dryRunOutputPackage} --dry-run --json`;
    const jsonOutput = execCmd<SfpcCombineResult>(command, { ensureExitCode: 0 }).jsonOutput;
    expect(jsonOutput?.result.path).toBeNull();
    expect(jsonOutput?.result.dryRun).toBe(true);
    expect(jsonOutput?.result.filesProcessed).toBe(3);
    expect(jsonOutput?.result.duplicatesRemoved).toBe(1);
    expect(existsSync(dryRunOutputPackage)).toBe(false);
  });
});
