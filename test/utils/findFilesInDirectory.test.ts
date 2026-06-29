import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findFilesInDirectory } from '../../src/utils/findFilesinDirectory.js';

describe('findFilesInDirectory', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'sfpc-test-'));
    await writeFile(join(tempDir, 'package.xml'), '<xml/>');
    await writeFile(join(tempDir, 'ignore-me.txt'), 'text content');
    await mkdir(join(tempDir, 'subdir'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns only xml files, excluding non-xml files and subdirectories', async () => {
    const { files, warnings } = await findFilesInDirectory([tempDir]);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/package\.xml$/);
    expect(warnings).toEqual([]);
  });

  it('returns initial-empty files array (not pre-populated)', async () => {
    const tempDir2 = await mkdtemp(join(tmpdir(), 'sfpc-empty-'));
    try {
      const { files } = await findFilesInDirectory([tempDir2]);
      expect(files).toEqual([]);
    } finally {
      await rm(tempDir2, { recursive: true, force: true });
    }
  });

  it('returns initial-empty warnings array (not pre-populated)', async () => {
    const { warnings } = await findFilesInDirectory([tempDir]);
    expect(warnings).toEqual([]);
  });

  it('adds warning for non-existent directory and returns no files', async () => {
    const missing = join(tempDir, 'does-not-exist');
    const { files, warnings } = await findFilesInDirectory([missing]);
    expect(files).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toBe(`Failed to read directory ${missing}`);
  });

  it('processes multiple directories and collects all xml files', async () => {
    const tempDir2 = await mkdtemp(join(tmpdir(), 'sfpc-test2-'));
    try {
      await writeFile(join(tempDir2, 'another.xml'), '<xml/>');
      const { files, warnings } = await findFilesInDirectory([tempDir, tempDir2]);
      expect(files).toHaveLength(2);
      expect(warnings).toEqual([]);
    } finally {
      await rm(tempDir2, { recursive: true, force: true });
    }
  });

  it('collects warnings for bad directories while still processing good ones', async () => {
    const missing = join(tempDir, 'does-not-exist');
    const { files, warnings } = await findFilesInDirectory([tempDir, missing]);
    expect(files).toHaveLength(1);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Failed to read directory');
    expect(warnings[0]).toContain('does-not-exist');
  });

  it('returns empty result for empty directory', async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), 'sfpc-empty-'));
    try {
      const { files, warnings } = await findFilesInDirectory([emptyDir]);
      expect(files).toEqual([]);
      expect(warnings).toEqual([]);
    } finally {
      await rm(emptyDir, { recursive: true, force: true });
    }
  });
});
