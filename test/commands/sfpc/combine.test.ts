import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it, expect } from '@jest/globals';

import { combinePackages } from '../../../src/core/combinePackages.js';
import { mergePackageXmlFiles } from '../../../src/core/mergePackageXmlFiles.js';

describe('sfpc combine', () => {
  const package1 = resolve('test/samples/pack1.xml');
  const package2 = resolve('test/samples/pack2.xml');
  const package3 = resolve('test/samples/pack3.xml');
  const invalidPackage1 = resolve('test/samples/invalid1.xml');
  const invalidPackage2 = resolve('test/samples/invalid2.xml');
  const invalidPackage3 = resolve('test/samples/invalid3.xml');
  const invalidDir = resolve('test/invalid');
  const outputPackage = resolve('package.xml');
  const baseline = resolve('test/samples/combinedPackage.xml');
  const emptyPackageBaseline = resolve('test/samples/emptyPackage.xml');
  const packageDir = resolve('test/samples/dir_sample');
  const invalidDirPackage = resolve('test/samples/dir_sample/invalid1.xml');
  const dirBaseline = resolve('test/samples/combinedPackageDir.xml');

  it('combines valid packages together', async () => {
    const warnings: string[] = [];
    const path = await combinePackages({
      packageFiles: [package1, package2, package3],
      combinedPackage: outputPackage,
      warn: (msg) => warnings.push(msg),
    });

    expect(path).toBe(outputPackage);
    expect(warnings).toHaveLength(0);
  });

  it('matches baseline output', async () => {
    const testPackage = await readFile(outputPackage, 'utf-8');
    const baselinePackage = await readFile(baseline, 'utf-8');
    expect(testPackage).toEqual(baselinePackage);
  });

  const invalids = [invalidPackage1, invalidPackage2, invalidPackage3];
  invalids.forEach((invalidFile, index) => {
    it(`handles invalid package ${index + 1}`, async () => {
      const warnings: string[] = [];
      const path = await combinePackages({
        packageFiles: [invalidFile],
        directories: [invalidDir],
        combinedPackage: outputPackage,
        warn: (msg) => warnings.push(msg),
      });

      expect(path).toBe(outputPackage);
      expect(warnings.join('\n')).toContain(`Invalid or empty package.xml: ${invalidFile}`);
    });

    it(`invalid package ${index + 1} matches empty baseline`, async () => {
      const testPackage = await readFile(outputPackage, 'utf-8');
      const baselinePackage = await readFile(emptyPackageBaseline, 'utf-8');
      expect(testPackage).toEqual(baselinePackage);
    });
  });

  it('combines packages and includes those in a directory', async () => {
    const warnings: string[] = [];
    const path = await combinePackages({
      packageFiles: [package1, package2, package3],
      directories: [packageDir],
      combinedPackage: outputPackage,
      warn: (msg) => warnings.push(msg),
    });

    expect(path).toBe(outputPackage);
    expect(warnings.join('\n')).toContain(`Invalid or empty package.xml: ${invalidDirPackage}`);
  });

  it('directory-based package matches baseline', async () => {
    const testPackage = await readFile(outputPackage, 'utf-8');
    const baselinePackage = await readFile(dirBaseline, 'utf-8');
    expect(testPackage).toEqual(baselinePackage);
  });

  it('uses default packageFiles when none provided', async () => {
    const warnings: string[] = [];
    const path = await combinePackages({
      directories: [packageDir],
      combinedPackage: outputPackage,
      warn: (msg) => warnings.push(msg),
    });

    expect(path).toBe(outputPackage);
  });
  it('uses default output path when combinedPackage is not specified', async () => {
    const warnings: string[] = [];
    const path = await combinePackages({
      packageFiles: [package1],
      warn: (msg) => warnings.push(msg),
    });

    expect(path).toBe('package.xml');
  });
  it('uses default warn function when none is provided', async () => {
    await expect(
      combinePackages({
        packageFiles: [invalidPackage1],
        combinedPackage: outputPackage,
      })
    ).resolves.toBe(outputPackage);
  });
  it('combines valid packages together at specified API version', async () => {
    const warnings: string[] = [];
    const path = await combinePackages({
      packageFiles: [package1, package2, package3],
      combinedPackage: outputPackage,
      warn: (msg) => warnings.push(msg),
      userApiVersion: '60.0',
    });

    expect(path).toBe(outputPackage);
    expect(warnings).toHaveLength(0);
  });
  it('combines valid packages together omitting the API version', async () => {
    const warnings: string[] = [];
    const path = await combinePackages({
      packageFiles: [package1, package2, package3],
      combinedPackage: outputPackage,
      warn: (msg) => warnings.push(msg),
      noApiVersion: true,
    });

    expect(path).toBe(outputPackage);
    expect(warnings).toHaveLength(0);
  });
  it('returns no warnings when files is null (skips processing)', async () => {
    const warnings = await mergePackageXmlFiles(null, 'package.xml', null, false);
    expect(warnings).toEqual([]);
  });
});
