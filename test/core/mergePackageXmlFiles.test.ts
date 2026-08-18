import { describe, expect, it, vi } from 'vitest';

import type { PackageManifestObject } from '../../src/core/types.js';

const writePackageMock = vi.fn<(pkg: PackageManifestObject, combinedPackage: string) => Promise<void>>(async () => {
  /* noop */
});

vi.mock('../../src/core/writePackage.js', () => ({
  writePackage: (pkg: PackageManifestObject, combinedPackage: string) => writePackageMock(pkg, combinedPackage),
}));

const { mergePackageXmlFiles } = await import('../../src/core/mergePackageXmlFiles.js');

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
