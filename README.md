# sf-package-combiner

[![NPM](https://img.shields.io/npm/v/sf-package-combiner.svg?label=sf-package-combiner)](https://www.npmjs.com/package/sf-package-combiner)
[![Downloads/week](https://img.shields.io/npm/dw/sf-package-combiner.svg)](https://npmjs.org/package/sf-package-combiner)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/sf-package-combiner/refs/heads/main/LICENSE.md)
[![Maintainability](https://qlty.sh/badges/c16e960e-68ce-4dc9-b0d1-47116b0b04da/maintainability.svg)](https://qlty.sh/gh/mcarvin8/projects/sf-package-combiner)
[![codecov](https://codecov.io/gh/mcarvin8/sf-package-combiner/graph/badge.svg?token=7YH0L48X3E)](https://codecov.io/gh/mcarvin8/sf-package-combiner)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fmcarvin8%2Fsf-package-combiner%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/mcarvin8/sf-package-combiner/main)

Merge multiple `package.xml` manifests into one. Use it in CI/CD pipelines to combine sfdx-git-delta output, manual lists, or other tool-generated manifests before a single `sf project deploy start`.

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

  - [Requirements](#requirements)
  - [Quick start](#quick-start)
  - [Command](#command)
    - [`sf sfpc combine`](#sf-sfpc-combine)
  - [How it works](#how-it-works)
  - [Example](#example)
  - [Invalid package.xml files](#invalid-packagexml-files)
  - [Issues](#issues)
  - [License](#license)
</details>

---

## Requirements

- Salesforce CLI (`sf`)
- Node.js **22.x or later**

---

## Quick start

```bash
# Install
sf plugins install sf-package-combiner@latest

# Combine 2 manifests into 1
sf sfpc combine -f pack1.xml -f pack2.xml -c package.xml

# Deploy combined manifest
sf project deploy start -x package.xml
```

Mix files and directories: use `-f` for specific files, `-d` for directories containing `package.xml` files.

---

## Command

### `sf sfpc combine`

Combine Salesforce manifest files into one `package.xml`.

```
USAGE
  $ sf sfpc combine [-f <value>] [-d <value>] [-c <value>] [-v <value>] [-n] [--json]

FLAGS
  -f, --package-file=<value>     Path to a package.xml file. Can be repeated.
  -d, --directory=<value>        Path to a directory containing package.xml files. Can be repeated.
  -c, --combined-package=<value> Path for the output file. Default: package.xml
  -v, --api-version=<value>      API version for the combined package (e.g. 62.0).
  -n, --no-api-version           Omit the <version> element in the output.

GLOBAL FLAGS
  --json  Output as JSON.
```

**Examples**

```bash
# Two files → package.xml (overwrites the input)
sf sfpc combine -f package.xml -f pack2.xml -c package.xml

# Files + directory
sf sfpc combine -f pack1.xml -f pack2.xml -d "test/sample_dir" -c package.xml

# Pin API version
sf sfpc combine -f pack1.xml -f pack2.xml -v "62.0" -c package.xml

# No version in output
sf sfpc combine -f pack1.xml -f pack2.xml -n -c package.xml
```

---

## How it works

- **Metadata types** — `<name>` values are normalized via Salesforce's metadata registry (correct casing, deduped).
- **Type order** — `CustomObject` is always listed before all other types; remaining types sort alphabetically. This avoids deployment failures when `CustomObject` and its children appear in the same manifest (see [scolladon/sfdx-git-delta#76](https://github.com/scolladon/sfdx-git-delta/pull/76)).
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

## Invalid package.xml files

Files that don't match the expected manifest structure or have no `<types>` are skipped with a warning. The underlying error from `@salesforce/source-deploy-retrieve` (SDR) is appended:

```
Warning: Invalid or empty package.xml: .\test\samples\invalid2.xml. [SDR] Missing metadata type definition in registry: CustomFields
```

> **Note:** A missing metadata type definition can also occur if the metadata type is newer than the SDR version bundled with this plugin. Dependabot checks for SDR updates weekly and auto-merges updates when the metadata registry changes.

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
