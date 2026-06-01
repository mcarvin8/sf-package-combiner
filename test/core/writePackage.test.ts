import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import type { PackageManifestObject } from '@salesforce/source-deploy-retrieve';

import { writePackage } from '../../src/core/writePackage.js';
import { sfXmlns } from '../../src/utils/constants.js';

describe('writePackage', () => {
  const outputPath = resolve('package.xml');

  const makePackage = (version: string): PackageManifestObject => ({
    Package: {
      '@_xmlns': sfXmlns,
      types: [],
      version,
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

  it('removes version element entirely when version is 0.0', async () => {
    await writePackage(makePackage('0.0'), outputPath);
    const content = await readFile(outputPath, 'utf-8');
    expect(content).not.toContain('<version>');
    expect(content).not.toContain('0.0');
    // Verify replacement is empty string, not a substituted value
    const unexpectedLines = content.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('<'));
    expect(unexpectedLines).toHaveLength(0);
  });

  it('does not corrupt content when stripping 0.0 version', async () => {
    await writePackage(makePackage('0.0'), outputPath);
    const content = await readFile(outputPath, 'utf-8');
    expect(content).toContain('<Package');
    expect(content).toContain('</Package>');
  });

  it('does not strip version when version is not 0.0', async () => {
    await writePackage(makePackage('61.0'), outputPath);
    const content = await readFile(outputPath, 'utf-8');
    expect(content).not.toContain('<version>0.0</version>');
    expect(content).toContain('<version>61.0</version>');
  });
});
