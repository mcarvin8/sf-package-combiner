import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { mapLimit } from 'async';

import { getConcurrencyThreshold } from './getConcurrencyThreshold.js';

export async function findFilesInDirectory(directories: string[]): Promise<{ files: string[]; warnings: string[] }> {
  const files: string[] = [];
  const warnings: string[] = [];
  const concurrencyLimit = getConcurrencyThreshold();

  await mapLimit(directories, concurrencyLimit, async (dir: string) => {
    try {
      const dirFiles = await readdir(dir, { withFileTypes: true });
      const xmlFiles = dirFiles
        .filter((file) => file.isFile() && file.name.endsWith('.xml'))
        .map((file) => join(dir, file.name));
      files.push(...xmlFiles);
    } catch (error) {
      warnings.push(`Failed to read directory ${dir}`);
    }
  });

  return { files, warnings };
}
