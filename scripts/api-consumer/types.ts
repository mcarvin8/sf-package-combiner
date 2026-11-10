// Compile-only check of the published type declarations, run as an external consumer
// with `tsc --noEmit` (see tsconfig.json next to this file). Never executed.
//
// Fails if the package stops shipping types, a public type is renamed or removed, or
// a field's type changes in a way that breaks existing callers.
import {
  type CombinePackagesOptions,
  combinePackages,
  type DuplicateMember,
  type SfpcCombineResult,
} from 'sf-package-combiner';

const options: CombinePackagesOptions = {
  packageFiles: ['package1.xml', 'package2.xml'],
  combinedPackage: 'package.xml',
  directories: ['manifests'],
  userApiVersion: '62.0',
  noApiVersion: false,
  dryRun: true,
  warn: (msg: string) => console.warn(msg),
};

const nullVersion: CombinePackagesOptions = { userApiVersion: null };
const empty: CombinePackagesOptions = {};

// @ts-expect-error -- packageFiles must be an array
const badFiles: CombinePackagesOptions = { packageFiles: 'package.xml' };

// @ts-expect-error -- unknown options are rejected
const unknownOption: CombinePackagesOptions = { failOnEmpty: true };

async function consume(): Promise<void> {
  const result: SfpcCombineResult = await combinePackages(options);
  const path: string | null = result.path;
  const dryRun: boolean = result.dryRun;
  const counts: number[] = [result.filesProcessed, result.types, result.members, result.duplicatesRemoved];
  const byType: Record<string, number> = result.membersByType;
  const apiVersion: string | undefined = result.apiVersion;
  const duplicate: DuplicateMember = result.duplicates[0];
  const where: string[] = duplicate.files;
  void [path, dryRun, counts, byType, apiVersion, duplicate.type, duplicate.member, where];

  await combinePackages();
}

void [nullVersion, empty, badFiles, unknownOption, consume];
