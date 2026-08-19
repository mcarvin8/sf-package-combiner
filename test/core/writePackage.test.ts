import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { PackageManifestObject } from '../../src/core/types.js';
import { writePackage } from '../../src/core/writePackage.js';
import { sfXmlns } from '../../src/utils/constants.js';

describe('writePackage', () => {
  const outputPath = resolve('write-package-test-output.xml');

  const makePackage = (version?: string): PackageManifestObject => ({
    Package: {
      '@_xmlns': sfXmlns,
      types: [],
      ...(version !== undefined ? { version } : {}),
    },
  });

  it('writes xml declaration header', async () => {
    await writePackage(makePackage('59.0'), outputPath);
    const content = await readFile(outputPath, 'utf-8');
    expect(content.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
  });

  it('preserves non-zero version in output', async () => {
    await writePackage(makePackage('59.0'), outputPath);
    const content = await readFile(outputPath, 'utf-8');
    expect(content).toContain('<version>59.0</version>');
  });

  it('omits version element entirely when version is undefined', async () => {
    await writePackage(makePackage(undefined), outputPath);
    const content = await readFile(outputPath, 'utf-8');
    expect(content).not.toContain('<version>');
  });

  it('does not corrupt content when version is omitted', async () => {
    await writePackage(makePackage(undefined), outputPath);
    const content = await readFile(outputPath, 'utf-8');
    expect(content).toContain('<Package');
    expect(content).toContain('</Package>');
  });
});
