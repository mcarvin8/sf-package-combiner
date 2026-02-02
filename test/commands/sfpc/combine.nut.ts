import { readFile } from 'node:fs/promises';
import { strictEqual } from 'node:assert';
import { resolve } from 'node:path';
import { describe, it, expect } from '@jest/globals';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';

describe('sfpc combine NUTs', () => {
  let session: TestSession;
  const package1 = resolve('test/samples/package-account-only.xml');
  const package2 = resolve('test/samples/package-mixed-types.xml');
  const package3 = resolve('test/samples/package-custom-label.xml');
  const outputPackage = resolve('package.xml');
  const baseline = resolve('test/samples/expected-combined.xml');

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
});
