# sf-package-combiner

[![NPM](https://img.shields.io/npm/v/sf-package-combiner.svg?label=sf-package-combiner)](https://www.npmjs.com/package/sf-package-combiner)
[![Downloads/week](https://img.shields.io/npm/dw/sf-package-combiner.svg)](https://npmjs.org/package/sf-package-combiner)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/sf-package-combiner/refs/heads/main/LICENSE.md)
[![Maintainability](https://qlty.sh/badges/c16e960e-68ce-4dc9-b0d1-47116b0b04da/maintainability.svg)](https://qlty.sh/gh/mcarvin8/projects/sf-package-combiner)
[![Code Coverage](https://qlty.sh/badges/c16e960e-68ce-4dc9-b0d1-47116b0b04da/test_coverage.svg)](https://qlty.sh/gh/mcarvin8/projects/sf-package-combiner)

A Salesforce CLI plugin that merges multiple `package.xml` manifests into a single file—ideal for combining incremental manifests (e.g. from [sfdx-git-delta](https://github.com/scolladon/sfdx-git-delta)) or multiple sources before deploy.

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

- [Quick start](#quick-start)
- [Why use this](#why-use-this)
- [Command reference](#command-reference)
- [Usage details](#usage-details)
- [Manifest structure](#manifest-structure)
- [Example](#example)
- [Invalid package.xml files](#invalid-packagexml-files)
- [Requirements](#requirements)
- [Issues](#issues)
- [License](#license)
</details>

---

## Quick start

```bash
# Install (use a specific version in place of x.y.z)
sf plugins install sf-package-combiner@x.y.z

# Combine two manifests into one
sf sfpc combine -f pack1.xml -f pack2.xml -c package.xml
```

You can mix files and directories: use `-f` for specific files and `-d` for directories that contain `package.xml` files.

---

## Why use this

- **Merge incremental manifests** — Combine output from tools like sfdx-git-delta with other package.xml files before deploying.
- **Single deploy manifest** — One `package.xml` from many sources (scripts, manual lists, other tools).
- **CI/CD friendly** — Generate a combined manifest in pipelines and deploy with `sf project deploy start -x package.xml`.

---

## Command reference

### `sf sfpc combine`

Combine Salesforce manifest files into one `package.xml`.

```
USAGE
  $ sf sfpc combine [-f <value>] [-d <value>] [-c <value>] [-v <value>] [-n] [--json]

FLAGS
  -f, --package-file=<value>     Path to a package.xml file. Can be repeated.
  -d, --directory=<value>       Path to a directory containing package.xml files. Can be repeated.
  -c, --combined-package=<value> Path for the output file. Default: package.xml
  -v, --api-version=<value>     API version for the combined package (e.g. 62.0).
  -n, --no-api-version          Omit the <version> element in the output.

GLOBAL FLAGS
  --json  Output as JSON.
```

**Examples**

```bash
# Two files → package.xml
sf sfpc combine -f pack1.xml -f pack2.xml -c package.xml

# Files + directory
sf sfpc combine -f pack1.xml -f pack2.xml -d "test/sample_dir" -c package.xml

# Pin API version
sf sfpc combine -f pack1.xml -f pack2.xml -v "62.0" -c package.xml

# No version in output
sf sfpc combine -f pack1.xml -f pack2.xml -n -c package.xml
```

---

## Usage details

### How it works

- **Metadata types** — `<name>` (type) values are normalized via Salesforce’s metadata registry (e.g. correct casing, deduped).
- **Type order** — `CustomObject` is always listed before any other types in the combined manifest; all other types are sorted alphabetically. This ordering avoids deployment issues when combining manifests (see [scolladon/sfdx-git-delta#76](https://github.com/scolladon/sfdx-git-delta/pull/76)).
- **Members** — `<members>` values keep their original case (Salesforce is case-sensitive for these).
- **API version** — By default, the **highest** `<version>` from the input manifests is used. If none have a version, it is omitted.
- **Overrides:** use `-v <version>` to set a specific version, or `-n` to omit version entirely.

### Manifest structure

Salesforce `package.xml` format:

- **Root:** `Package` with `xmlns="http://soap.sforce.com/2006/04/metadata"`.
- **Types:** Each `<types>` block has `<members>` (API names) and `<name>` (metadata type, e.g. `ApexClass`, `CustomObject`).
- **Version (optional):** `<version>` for the Metadata API version.

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

(Highest input version `62.0` is used.)

---

## Invalid package.xml files

Files that don’t match the expected [manifest structure](#manifest-structure) or have no `<types>` are **skipped** with a warning. When processing fails, the underlying error from @salesforce/source-deploy-retrieve (e.g. unknown metadata types not in the registry) is appended:

```
Warning: Invalid or empty package.xml: .\test\samples\invalid2.xml. [SDR] Missing metadata type definition in registry: CustomFields
```

> **Note:** A missing metadata type definition can also occur if the type is newer than the @salesforce/source-deploy-retrieve version bundled with this plugin. Upgrading the plugin may resolve the issue for newly released metadata types.

If every input is invalid or empty, the combined file will have no `<types>`. To avoid deploying an empty package, check for `<types>` before deploying:

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

## Requirements

- [Salesforce CLI](https://developer.salesforce.com/tools/sf) (`sf`)
- Node.js **20.x or later** (for the plugin)

---

## Issues

Bugs and feature requests: [GitHub Issues](https://github.com/mcarvin8/sf-package-combiner/issues).

---

## License

MIT. See [LICENSE](LICENSE.md) in this repo.
