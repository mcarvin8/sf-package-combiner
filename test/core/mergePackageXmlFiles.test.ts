import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import type { PackageManifestObject } from '../../src/core/types.js';

const writePackageMock = vi.fn<(pkg: PackageManifestObject, combinedPackage: string) => Promise<void>>(async () => {
  /* noop */
});

vi.mock('../../src/core/writePackage.js', () => ({
  writePackage: (pkg: PackageManifestObject, combinedPackage: string) => writePackageMock(pkg, combinedPackage),
}));

const { mergePackageXmlFiles, isEarlierSource } = await import('../../src/core/mergePackageXmlFiles.js');

describe('isEarlierSource', () => {
  it('returns true when there is no existing source index', () => {
    expect(isEarlierSource(3, undefined)).toBe(true);
  });

  it('returns true when the candidate index is earlier than the existing one', () => {
    expect(isEarlierSource(1, 2)).toBe(true);
  });

  it('returns false when the candidate index is later than the existing one', () => {
    expect(isEarlierSource(2, 1)).toBe(false);
  });

  it('returns false when the candidate index equals the existing one', () => {
    expect(isEarlierSource(1, 1)).toBe(false);
  });
});

describe('mergePackageXmlFiles version key', () => {
  it('omits the version key entirely when noApiVersion is true', async () => {
    await mergePackageXmlFiles(null, 'package.xml', null, true);

    const [packageContents] = writePackageMock.mock.calls.at(-1)!;
    expect('version' in packageContents.Package).toBe(false);
  });

  it('includes the version key when userApiVersion is provided', async () => {
    await mergePackageXmlFiles(null, 'package.xml', '61.0', false);

    const [packageContents] = writePackageMock.mock.calls.at(-1)!;
    expect(packageContents.Package.version).toBe('61.0');
  });
});

describe('mergePackageXmlFiles input <version> validation', () => {
  const manifest = (version: string): string =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n  <types>\n    <members>Account</members>\n    <name>CustomObject</name>\n  </types>\n  <version>${version}</version>\n</Package>\n`;

  async function writeManifests(versions: string[]): Promise<string[]> {
    const dir = await mkdtemp(join(tmpdir(), 'sfpc-version-'));
    return Promise.all(
      versions.map(async (version, i) => {
        const file = join(dir, `package${i}.xml`);
        await writeFile(file, manifest(version));
        return file;
      }),
    );
  }

  it('ignores a malformed version with a warning but still merges the types', async () => {
    const [bad, good] = await writeManifests(['62', '59.0']);
    const result = await mergePackageXmlFiles([bad, good], 'package.xml', null, false, true);

    expect(result.apiVersion).toBe('59.0');
    expect(result.types).toBe(1);
    expect(result.warnings).toEqual([
      `Ignoring <version> in ${bad}. Invalid API version "62". Expected a format like "62.0".`,
    ]);
  });

  it('ignores a retired version with a warning', async () => {
    const [retired] = await writeManifests(['20.0']);
    const result = await mergePackageXmlFiles([retired], 'package.xml', null, false, true);

    expect(result.apiVersion).toBeUndefined();
    expect(result.members).toBe(1);
    expect(result.warnings).toEqual([
      `Ignoring <version> in ${retired}. API version 20.0 is retired. The minimum supported version is 21.0.`,
    ]);
  });

  it('picks the numerically highest valid version', async () => {
    const files = await writeManifests(['99.0', '100.0']);
    const result = await mergePackageXmlFiles(files, 'package.xml', null, false, true);

    expect(result.apiVersion).toBe('100.0');
    expect(result.warnings).toEqual([]);
  });
});
