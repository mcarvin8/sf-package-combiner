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
  const package3 = resolve('test/samples/pack3.xml');
  const invalidPackage1 = resolve('test/samples/invalid1.xml');
  const invalidPackage2 = resolve('test/samples/invalid2.xml');
  const invalidPackage3 = resolve('test/samples/invalid3.xml');
  const outputPackage = resolve('package.xml');
  const baseline = resolve('test/samples/combinedPackage.xml');
  const emptyPackageBaseline = resolve('test/samples/emptyPackage.xml');
  const packageDir = resolve('test/samples/dir_sample');
  const invalidDirPackage = resolve('test/samples/dir_sample/invalid1.xml');
  const dirBaseline = resolve('test/samples/combinedPackageDir.xml');

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  after(async () => {
    await rm(outputPackage);
  });

  it('combine the valid packages together.', async () => {
    await SfpcCombine.run(['-f', package1, '-f', package2, '-f', package3, '-c', outputPackage]);
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
  it('test the invalid packages.', async () => {
    await SfpcCombine.run(['-f', invalidPackage1, '-c', outputPackage]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`Combined package.xml written to: ${outputPackage}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include(`File ${invalidPackage1} does not match expected Salesforce package structure.`);
  });
  it('confirm the invalid XML is an empty package.', async () => {
    const testPackage = await readFile(outputPackage, 'utf-8');
    const baselinePackage = await readFile(emptyPackageBaseline, 'utf-8');
    strictEqual(
      testPackage,
      baselinePackage,
      `File content is different between ${outputPackage} and ${emptyPackageBaseline}`
    );
  });
  it('test the invalid packages.', async () => {
    await SfpcCombine.run(['-f', invalidPackage2, '-c', outputPackage]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`Combined package.xml written to: ${outputPackage}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include(`File ${invalidPackage2} does not match expected Salesforce package structure.`);
  });
  it('confirm the invalid XML is an empty package.', async () => {
    const testPackage = await readFile(outputPackage, 'utf-8');
    const baselinePackage = await readFile(emptyPackageBaseline, 'utf-8');
    strictEqual(
      testPackage,
      baselinePackage,
      `File content is different between ${outputPackage} and ${emptyPackageBaseline}`
    );
  });
  it('test the invalid packages.', async () => {
    await SfpcCombine.run(['-f', invalidPackage3, '-c', outputPackage]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`Combined package.xml written to: ${outputPackage}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include(`File ${invalidPackage3} does not match expected Salesforce package structure.`);
  });
  it('confirm the invalid XML is an empty package.', async () => {
    const testPackage = await readFile(outputPackage, 'utf-8');
    const baselinePackage = await readFile(emptyPackageBaseline, 'utf-8');
    strictEqual(
      testPackage,
      baselinePackage,
      `File content is different between ${outputPackage} and ${emptyPackageBaseline}`
    );
  });
  it('combine the valid packages together including the ones in a directory.', async () => {
    await SfpcCombine.run(['-f', package1, '-f', package2, '-f', package3, '-d', packageDir, '-c', outputPackage]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`Combined package.xml written to: ${outputPackage}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include(`File ${invalidDirPackage} does not match expected Salesforce package structure.`);
  });
  it('confirm the package created in the previous test using a directory is the same as the baseline.', async () => {
    const testPackage = await readFile(outputPackage, 'utf-8');
    const baselinePackage = await readFile(dirBaseline, 'utf-8');
    strictEqual(testPackage, baselinePackage, `File content is different between ${outputPackage} and ${dirBaseline}`);
  });
});
