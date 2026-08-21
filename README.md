# sf-package-combiner

[![NPM](https://img.shields.io/npm/v/sf-package-combiner.svg?label=sf-package-combiner)](https://www.npmjs.com/package/sf-package-combiner)
[![Downloads/week](https://img.shields.io/npm/dw/sf-package-combiner.svg)](https://npmjs.org/package/sf-package-combiner)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/sf-package-combiner/refs/heads/main/LICENSE.md)
[![Maintainability](https://qlty.sh/badges/c16e960e-68ce-4dc9-b0d1-47116b0b04da/maintainability.svg)](https://qlty.sh/gh/mcarvin8/projects/sf-package-combiner)
[![codecov](https://codecov.io/gh/mcarvin8/sf-package-combiner/graph/badge.svg?token=7YH0L48X3E)](https://codecov.io/gh/mcarvin8/sf-package-combiner)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fmcarvin8%2Fsf-package-combiner%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/mcarvin8/sf-package-combiner/main)

Merge multiple Salesforce `package.xml` manifests into one. Use it in CI/CD pipelines to combine sfdx-git-delta output, manual lists, or other tool-generated manifests before a single `sf project deploy start`. Available as a **Salesforce CLI plugin** for any provider, and as a **native GitHub Action** for GitHub Actions users who want to skip installing the CLI.

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

  - [Requirements](#requirements)
  - [Quick start](#quick-start)
  - [GitHub Action](#github-action)
  - [Command](#command)
    - [`sf sfpc combine`](#sf-sfpc-combine)
  - [How it works](#how-it-works)
  - [Example](#example)
  - [Invalid Manifests](#invalid-manifests)
  - [Issues](#issues)
  - [License](#license)
</details>

---

## Requirements

- Salesforce CLI (`sf`)
- Node.js **22.19 or later**

---

## Quick start

```bash
# Install
sf plugins install sf-package-combiner@latest

# Combine 2 manifests into 1
sf sfpc combine -f package1.xml -f package2.xml -c package.xml

# Deploy combined manifest
sf project deploy start -x package.xml
```

Mix files and directories: use `-f` for specific files, `-d` for directories containing `package.xml` files.

---

## GitHub Action

For GitHub Actions, this is also available as a native Action — no `sf` CLI or plugin install required:

```yaml
- name: Combine packages
  uses: mcarvin8/sf-package-combiner@v4
  with:
    package-file: |
      package1.xml
      package2.xml
    combined-package: package.xml
```

### Inputs

| Input               | Description                                                                     | Required | Default        |
| -------------------- | -------------------------------------------------------------------------------- | -------- | -------------- |
| `package-file`        | Path to a `package.xml` file to combine, one per line.                           | No       |                 |
| `directory`           | Directory to look for `package.xml` files in, one per line.                      | No       |                 |
| `combined-package`     | Path to the combined `package.xml` that will be created by this action.          | No       | `package.xml`   |
| `api-version`         | API version to use in the combined `package.xml`. Defaults to the highest version found across the input manifests. | No       |                 |
| `no-api-version`       | Explicitly omit the API version in the combined `package.xml`.                   | No       | `false`         |
| `dry-run`             | Preview the combined package summary without writing an output file.             | No       | `false`         |
| `fail-on-empty`        | Fail the action if the combined `package.xml` has no `<types>` (e.g. every input was invalid or empty). | No       | `false`         |

### Outputs

| Output                | Description                                                          |
| ---------------------- | ---------------------------------------------------------------------- |
| `combined-package-path` | Path to the combined `package.xml` (empty on a dry run).             |
| `files-processed`      | Number of input `package.xml` files processed.                       |
| `types`                | Number of distinct metadata types in the combined package.           |
| `members`              | Number of members in the combined package.                           |
| `duplicates-removed`    | Number of duplicate members removed while combining.                 |
| `api-version`          | API version used in the combined `package.xml` (empty when omitted). |
| `warnings`             | Newline-separated list of warnings emitted while combining, if any.  |

### Example: fail the build on an empty combined package

```yaml
- name: Combine packages
  id: combine
  uses: mcarvin8/sf-package-combiner@v4
  with:
    package-file: |
      package1.xml
      package2.xml
    directory: manifests/
    fail-on-empty: 'true'

- name: Deploy combined manifest
  run: sf project deploy start -x "${{ steps.combine.outputs.combined-package-path }}"
```

---

## Command

<!-- commands -->
* [`sf sfpc combine`](#sf-sfpc-combine)

## `sf sfpc combine`

Combine multiple package.xml files together.

```
USAGE
  $ sf sfpc combine [--json] [--flags-dir <value>] [-f <value>...] [-c <value>] [-d <value>...] [-v <value>] [-n]
    [--dry-run]

FLAGS
  -c, --combined-package=<value>  [default: package.xml] Combined package file path.
  -d, --directory=<value>...      Directory to look for package.xml files in.
  -f, --package-file=<value>...   Path to a package.xml file.
  -n, --no-api-version            Explicitly omit the API version in the combined package.xml.
  -v, --api-version=<value>       Sets the API version to use in the combined package.xml.
      --dry-run                   Preview the combined package summary (types, members, duplicates) without writing an
                                  output file.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Combine multiple package.xml files together.

  Read multiple package.xml files, then parse them and combine them to create 1 final package for deployments.

EXAMPLES
  $ sf sfpc combine -f package1.xml -f package2.xml -c package.xml

  $ sf sfpc combine -f package1.xml -d "test/directory" -c package.xml

  $ sf sfpc combine -f package1.xml -f package2.xml -v 60.0 -c package.xml

  $ sf sfpc combine -f package1.xml -f package2.xml -c package.xml -n

  $ sf sfpc combine -f package1.xml -f package2.xml --dry-run --json

FLAG DESCRIPTIONS
  -v, --api-version=<value>  Sets the API version to use in the combined package.xml.

    Override the api version used for api requests made by this command
```

_See code: [src/commands/sfpc/combine.ts](https://github.com/mcarvin8/sf-package-combiner/blob/v4.1.0/src/commands/sfpc/combine.ts)_
<!-- commandsstop -->

---

## How it works

- **Metadata types** — `<name>` values are deduplicated case-insensitively (`CustomObject` and `customobject` merge into one `<types>` block, using the casing first encountered). They are **not** validated or normalized against Salesforce's metadata registry — see [Invalid Manifests](#invalid-manifests).
- **Type order** — `CustomObject` (any casing) is always listed before all other types; remaining types sort alphabetically. This avoids deployment failures when `CustomObject` and its children appear in the same manifest (see [scolladon/sfdx-git-delta#76](https://github.com/scolladon/sfdx-git-delta/pull/76)).
- **Members** — `<members>` values keep their original case (Salesforce API names are case-sensitive).
- **API version** — Highest `<version>` from all input manifests is used. Override with `-v`, or omit entirely with `-n`.

---

## Example

**Input: `package1.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <types>
    <members>MyApexClass</members>
    <name>ApexClass</name>
  </types>
  <version>60.0</version>
</Package>
```

**Input: `package2.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <types>
    <members>MyTrigger</members>
    <name>ApexTrigger</name>
  </types>
  <version>62.0</version>
</Package>
```

**Command**

```bash
sf sfpc combine -f "package1.xml" -f "package2.xml" -c "package.xml"
```

**Output: `package.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <types>
    <members>MyApexClass</members>
    <name>ApexClass</name>
  </types>
  <types>
    <members>MyTrigger</members>
    <name>ApexTrigger</name>
  </types>
  <version>62.0</version>
</Package>
```

Highest input version (`62.0`) is used.

---

## Invalid Manifests

Manifests are parsed in-house and checked only against the Metadata API manifest *structure* — a single `<Package>` root containing zero or more `<types>` blocks (each with exactly one `<name>` and one or more `<members>`) and at most one `<version>`. Metadata type names in `<name>` are **not** validated against Salesforce's metadata registry, so a typo'd or nonexistent type (e.g. `CustomFields` instead of `CustomField`) will pass through to the combined output — deployment will fail on it later, not here. This also means combining is no longer blocked by a metadata type being newer than any bundled registry.

Files that don't match the expected structure, or have no `<types>`, are skipped with a warning and the underlying parse error is appended:

```
Warning: Invalid or empty package.xml: .\test\samples\invalid2.xml. unexpected element <type> inside <Package>
```

If every input is invalid or empty, the output will have no `<types>`. Guard against deploying an empty package:

```bash
sf sfpc combine -f "package/package.xml" -f "package.xml" -c "package.xml"
if grep -q '<types>' ./package.xml; then
  echo "---- Deploying added and modified metadata ----"
  sf project deploy start -x package.xml
else
  echo "---- No changes to deploy ----"
fi
```

---

## Issues

Bugs or feature requests? Submit an [issue](https://github.com/mcarvin8/sf-package-combiner/issues).

---

## License

[MIT](LICENSE.md)
