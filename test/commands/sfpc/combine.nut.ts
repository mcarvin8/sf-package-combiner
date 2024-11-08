import { rm, readFile } from 'node:fs/promises';
import { strictEqual } from 'node:assert';
import { resolve } from 'node:path';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

describe('sfpc combine NUTs', () => {
  let session: TestSession;
  const package1 = resolve('test/samples/pack1.xml');
  const package2 = resolve('test/samples/pack2.xml');
  const outputPackage = resolve('package.xml');
  const baseline = resolve('test/samples/combinedPackage.xml');

  before(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
  });

  after(async () => {
    await session?.clean();
    await rm(outputPackage);
  });

  it('combine the 2 packages together', () => {
    const command = `sfpc combine -f ${package1} -f ${package2} -c ${outputPackage}`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(output).to.contain(`Combined package.xml written to: ${outputPackage}`);
  });
  it('confirm the XML files created are the same as the baselines.', async () => {
    const testPackage = await readFile(outputPackage, 'utf-8');
    const baselinePackage = await readFile(baseline, 'utf-8');
    strictEqual(testPackage, baselinePackage, `File content is different between ${outputPackage} and ${baseline}`);
  });
});
