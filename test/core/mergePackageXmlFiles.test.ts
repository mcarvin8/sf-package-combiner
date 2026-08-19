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
