import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it, expect } from '@jest/globals';

import { combinePackages } from '../../../src/core/combinePackages.js';
import {
  mergePackageXmlFiles,
  sortTypesWithCustomObjectFirst,
  CUSTOM_OBJECT_TYPE,
} from '../../../src/core/mergePackageXmlFiles.js';

describe('sfpc combine', () => {
  const package1 = resolve('test/samples/package-account-only.xml');
  const package2 = resolve('test/samples/package-mixed-types.xml');
  const package3 = resolve('test/samples/package-custom-label.xml');
  const invalidPackage1 = resolve('test/samples/invalid-wrong-tag.xml');
  const invalidPackage2 = resolve('test/samples/invalid-duplicate-version.xml');
  const invalidPackage3 = resolve('test/samples/invalid-duplicate-name.xml');
  const invalidDir = resolve('test/invalid');
  const outputPackage = resolve('package.xml');
  const baseline = resolve('test/samples/expected-combined.xml');
  const emptyPackageBaseline = resolve('test/samples/package-empty.xml');
  const packageDir = resolve('test/samples/dir_sample');
  const invalidDirPackage = resolve('test/samples/dir_sample/invalid-wrong-tag.xml');
  const dirBaseline = resolve('test/samples/expected-combined-with-dir.xml');

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

  it('sorts non-CustomObject types alphabetically (branch coverage for sortTypesWithCustomObjectFirst)', async () => {
    const packageNonObjectTypes = resolve('test/samples/package-non-object-types.xml');
    await mergePackageXmlFiles([packageNonObjectTypes], outputPackage, null, false);

    const output = await readFile(outputPackage, 'utf-8');
    // CustomLabel comes before StandardValueSet alphabetically when neither is CustomObject
    expect(output.indexOf('CustomLabel')).toBeLessThan(output.indexOf('StandardValueSet'));
  });

  describe('sortTypesWithCustomObjectFirst', () => {
    it('returns -1 when a is CustomObject and b is not (CustomObject first)', () => {
      expect(sortTypesWithCustomObjectFirst({ name: CUSTOM_OBJECT_TYPE }, { name: 'CustomLabel' })).toBe(-1);
    });
    it('returns 1 when a is not CustomObject and b is (CustomObject first)', () => {
      expect(sortTypesWithCustomObjectFirst({ name: 'CustomLabel' }, { name: CUSTOM_OBJECT_TYPE })).toBe(1);
    });
    it('returns localeCompare result when neither is CustomObject', () => {
      expect(sortTypesWithCustomObjectFirst({ name: 'CustomLabel' }, { name: 'StandardValueSet' })).toBeLessThan(0); // CustomLabel < StandardValueSet
    });
    it('returns localeCompare result when both are CustomObject', () => {
      expect(sortTypesWithCustomObjectFirst({ name: CUSTOM_OBJECT_TYPE }, { name: CUSTOM_OBJECT_TYPE })).toBe(0);
    });
  });
});
