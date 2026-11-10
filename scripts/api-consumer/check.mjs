// Runtime check of the public programmatic API, run as an external consumer.
//
// Copied into a scratch project that installs sf-package-combiner (from an
// `npm pack` tarball or the npm registry), so the import below resolves through
// the package's `exports` map exactly like it would for a real user.
//
// Usage: node check.mjs <samplesDir> <outDir>
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import * as api from 'sf-package-combiner';
import { combinePackages } from 'sf-package-combiner';

const [samplesDir, outDir] = process.argv.slice(2);
assert.ok(samplesDir && outDir, 'usage: check.mjs <samplesDir> <outDir>');

const sample = (name) => join(samplesDir, name);
const twoFiles = [sample('package-account-only.xml'), sample('package-custom-label.xml')];

let passed = 0;
async function check(name, fn) {
  await fn();
  passed++;
  console.log(`ok - ${name}`);
}

function collectWarnings() {
  const warnings = [];
  return { warnings, warn: (msg) => warnings.push(msg) };
}

await check('exports', () => {
  assert.equal(typeof combinePackages, 'function');
  assert.deepEqual(Object.keys(api), ['combinePackages']);
});

await check('dry run merges in memory and writes nothing', async () => {
  const combinedPackage = join(outDir, 'dry-run.xml');
  const { warnings, warn } = collectWarnings();
  const result = await combinePackages({ packageFiles: twoFiles, combinedPackage, dryRun: true, warn });
  assert.equal(result.path, null);
  assert.equal(result.dryRun, true);
  assert.equal(result.filesProcessed, 2);
  assert.equal(result.types, 2);
  assert.equal(result.members, 2);
  assert.deepEqual(result.membersByType, { CustomLabel: 1, CustomObject: 1 });
  assert.deepEqual(warnings, []);
  await assert.rejects(access(combinedPackage), { code: 'ENOENT' });
});

await check('writes the combined package.xml', async () => {
  const combinedPackage = join(outDir, 'combined.xml');
  const result = await combinePackages({ packageFiles: twoFiles, combinedPackage, userApiVersion: '62.0' });
  assert.equal(result.path, combinedPackage);
  assert.equal(result.apiVersion, '62.0');
  const xml = await readFile(combinedPackage, 'utf-8');
  for (const fragment of [
    '<members>Account</members>',
    '<name>CustomObject</name>',
    '<members>Auto</members>',
    '<name>CustomLabel</name>',
    '<version>62.0</version>',
  ]) {
    assert.ok(xml.includes(fragment), `combined package missing ${fragment}`);
  }
});

await check('noApiVersion omits <version>', async () => {
  const combinedPackage = join(outDir, 'no-version.xml');
  const result = await combinePackages({ packageFiles: twoFiles, combinedPackage, noApiVersion: true });
  assert.equal(result.apiVersion, undefined);
  assert.ok(!(await readFile(combinedPackage, 'utf-8')).includes('<version>'));
});

await check('duplicates across inputs are removed and reported', async () => {
  const dup = sample('package-account-only.xml');
  const result = await combinePackages({ packageFiles: [dup, dup], dryRun: true });
  assert.equal(result.members, 1);
  assert.equal(result.duplicatesRemoved, 1);
  assert.equal(result.duplicates[0].type, 'CustomObject');
  assert.equal(result.duplicates[0].member, 'Account');
});

await check('directories are scanned and invalid manifests warn', async () => {
  const { warnings, warn } = collectWarnings();
  const result = await combinePackages({ directories: [sample('dir_sample')], dryRun: true, warn });
  assert.equal(result.filesProcessed, 3);
  assert.ok(result.types > 0);
  assert.ok(
    warnings.some((w) => w.includes('invalid-wrong-tag.xml')),
    `expected a warning for the invalid file, got ${JSON.stringify(warnings)}`,
  );
});

await check('only invalid input yields an empty result, not an error', async () => {
  const { warnings, warn } = collectWarnings();
  const result = await combinePackages({ packageFiles: [sample('invalid-wrong-tag.xml')], dryRun: true, warn });
  assert.equal(result.types, 0);
  assert.equal(warnings.length, 1);
});

await check('no options', async () => {
  const result = await combinePackages({ dryRun: true });
  assert.equal(result.filesProcessed, 0);
  assert.equal(result.types, 0);
});

await check('deep imports are blocked by the exports map', async () => {
  await assert.rejects(import('sf-package-combiner/lib/core/combinePackages.js'), {
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
  });
});

console.log(`\n${passed} checks passed`);
