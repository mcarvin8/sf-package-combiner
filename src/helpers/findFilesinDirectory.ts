import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function findFilesInDirectory(directories: string[]): Promise<{ files: string[]; warnings: string[] }> {
  const files: string[] = [];
  const warnings: string[] = [];

  const promises = directories.map(async (dir) => {
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

  await Promise.all(promises);

  return { files, warnings };
}
