import { findFilesInDirectory } from '../utils/findFilesinDirectory.js';
import { mergePackageXmlFiles } from './mergePackageXmlFiles.js';
import { SfpcCombineResult } from './types.js';

export async function combinePackages({
  packageFiles = [],
  combinedPackage = 'package.xml',
  directories = [],
  userApiVersion = null,
  noApiVersion = false,
  dryRun = false,
  warn = (_msg: string): void => {
    /* noop default */
  },
}: {
  packageFiles?: string[];
  combinedPackage?: string;
  directories?: string[];
  userApiVersion?: string | null;
  noApiVersion?: boolean;
  dryRun?: boolean;
  warn?: (msg: string) => void;
}): Promise<SfpcCombineResult> {
  const files = [...packageFiles];
  const warnings: string[] = [];

  // Stryker disable next-line ConditionalExpression,EqualityOperator -- findFilesInDirectory([]) is a no-op, making true/>=0 equivalent
  if (directories.length > 0) {
    const { files: dirFiles, warnings: dirWarnings } = await findFilesInDirectory(directories);
    files.push(...dirFiles);
    warnings.push(...dirWarnings);
  }

  const result = await mergePackageXmlFiles(files, combinedPackage, userApiVersion, noApiVersion, dryRun);
  warnings.push(...result.warnings);

  warnings.forEach(warn);

  return {
    path: dryRun ? null : combinedPackage,
    dryRun,
    filesProcessed: files.length,
    types: result.types,
    members: result.members,
    duplicatesRemoved: result.duplicatesRemoved,
    duplicates: result.duplicates,
    membersByType: result.membersByType,
    apiVersion: result.apiVersion,
  };
}
