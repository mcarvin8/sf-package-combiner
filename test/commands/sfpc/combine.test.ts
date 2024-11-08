import { rm, readFile } from 'node:fs/promises';
import { strictEqual } from 'node:assert';
import { resolve } from 'node:path';

import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import SfpcCombine from '../../../src/commands/sfpc/combine.js';

describe('sfpc combine', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  const package1 = resolve('test/samples/pack1.xml');
  const package2 = resolve('test/samples/pack2.xml');
  const outputPackage = resolve('package.xml');
  const baseline = resolve('test/samples/combinedPackage.xml');

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  after(async () => {
    await rm(outputPackage);
  });

  it('combine the 2 packages together', async () => {
    await SfpcCombine.run(['-f', package1, '-f', package2, '-c', outputPackage]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`Combined package.xml written to: ${outputPackage}`);
  });
  it('confirm the XML files created are the same as the baselines.', async () => {
    const testPackage = await readFile(outputPackage, 'utf-8');
    const baselinePackage = await readFile(baseline, 'utf-8');
    strictEqual(testPackage, baselinePackage, `File content is different between ${outputPackage} and ${baseline}`);
  });
});
