# sf-package-combiner

[![NPM](https://img.shields.io/npm/v/sf-package-combiner.svg?label=sf-package-combiner)](https://www.npmjs.com/package/sf-package-combiner) [![Downloads/week](https://img.shields.io/npm/dw/sf-package-combiner.svg)](https://npmjs.org/package/sf-package-combiner) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/sf-package-combiner/refs/heads/main/LICENSE.md)

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

- [Install](#install)
- [Command](#command)
  - [`sf-sfpc-combine`](#sf-sfpc-combine)
- [Usage](#usage)
- [Manifest Structure](#manifest-structure)
- [Example](#example)
- [Issues](#issues)
- [License](#license)
</details>

**Combine multiple Salesforce `package.xml` files into a single manifest** for deployments. This is useful when:  

- Using tools like `sfdx-git-delta` to generate incremental package.xml files  
- Merging different package.xml files from various sources  
- Ensuring a streamlined deployment process in CI/CD workflows  

## Install

```bash
sf plugins install sf-package-combiner@x.y.z
```

## Command

<!-- commands -->

- [`sf sfpc combine`](#sf-sfpc-combine)

## `sf sfpc combine`

Combine Salesforce manifest files together.

```
USAGE
  $ sf sfpc combine [-f <value>] [-d <value>] [-c <value>] [-v <value>] [-n] [--json]

FLAGS
  -f, --package-file=<value>     The path to an existing package.xml file.
                                 Can be specified multiple times.
  -d, --directory=<value>        The path to an existing directory with package.xml files.
                                 Only XML files in the immediate directory will be scanned.
                                 Can be specified multiple times.
  -v, --api-version=<value>      Specify the API version to use in the combined package.xml.
                                 Must be a float value (e.g., '62.0') and be an active API version.
                                 If not declared, it will default to the max API version found in all inputs.
  -n, --no-api-version           Intentionally omit the API version in the combined package.xml.
                                 If not declared, it will default to the max API version found in all inputs.
  -c, --combined-package=<value> The path to save the combined package.xml to.
                                 If this value matches one of the input packages, it will overwrite the file.
                                 Default is "package.xml".

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Combine multiple package files into 1 file.

EXAMPLES
  Combine pack1.xml and pack2.xml into package.xml

    $ sf sfpc combine -f pack1.xml -f pack2.xml -c package.xml

  Combine pack1.xml, pack2.xml, and all package XML files in a directory into package.xml

    $ sf sfpc combine -f pack1.xml -f pack2.xml -d "test/sample_dir" -c package.xml

  Combine pack1.xml and pack2.xml into package.xml set at API version 62.0

    $ sf sfpc combine -f pack1.xml -f pack2.xml -v "62.0" -c package.xml

  Combine pack1.xml and pack2.xml into package.xml with no API version declared

    $ sf sfpc combine -f pack1.xml -f pack2.xml -n -c package.xml
```

<!-- commandsstop -->

## Usage  

### How it Works  

- The `<name>` elements (metadata types) are **converted to lowercase** to ensure consistency and avoid duplicates.  
- The `<members>` elements **retain their original case**, as Salesforce treats them as case-sensitive.  
- By default, the **highest API version** found in the input manifests is used.  
- If no `<version>` tag is found, it is omitted from the final `package.xml`.  

**To override the API version behavior:**  
- Use `-v <version>` to **set a specific API version**.  
- Use `-n` to **omit the API version entirely**.  

### Handling Invalid `package.xml` Files  

If a file doesn't match the expected structure, it is skipped with a warning:  

```plaintext
Warning: File ./test/samples/pack2.xml does not match expected Salesforce package structure.
```

---

## Manifest Structure

Salesforce `package.xml` files follow this structure:  

- **Root:** `<Package xmlns="http://soap.sforce.com/2006/04/metadata">`  
- **Metadata Types:** `<types>` contains:  
  - `<members>`: Lists metadata item(s) via their API names.  
  - `<name>`: Metadata type (e.g., `ApexClass`, `CustomObject`).  
- **API Version (Optional):** `<version>` specifies the metadata API version.

## Example  

The example below demonstrates the following use-case:
1. Run `sfdx-git-delta` to generate an incremental `package/package.xml` 
2. Declare additional metadata in a commit message and create a temporary `package.xml`
3. Run `sf-package-combiner` to merge both packages into `package.xml`

### Input  

#### `package/package.xml` - incremental package

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

#### `package.xml` - commit message

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

### Command  

```bash
sf sfpc combine -f "package/package.xml" -f "package.xml" -c "package.xml"
```

### Output (`package.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <types>
    <members>MyApexClass</members>
    <name>apexclass</name>
  </types>
  <types>
    <members>MyTrigger</members>
    <name>apextrigger</name>
  </types>
  <version>62.0</version>
</Package>
```

```bash
#!/bin/bash
set -e

DEPLOY_PACKAGE="package.xml"

# Define a function to build package.xml from commit message
build_package_from_commit() {
    local commit_msg="$1"
    local output_file="$2"
    PACKAGE_FOUND="False"

    # Use sed to match and extract the XML package content
    package_xml_content=$(echo "$commit_msg" | sed -n '/<Package xmlns=".*">/,/<\/Package>/p')

    if [[ -n "$package_xml_content" ]]; then
        echo "Found package.xml contents in the commit message."
        echo "$package_xml_content" > "$output_file"
        PACKAGE_FOUND="True"
    else
        echo "WARNING: No package.xml contents found in the commit message."
    fi
    export PACKAGE_FOUND
}

build_package_from_commit "$COMMIT_MSG" "$DEPLOY_PACKAGE"
# create incremental package in default locations
sf sgd source delta --to "HEAD" --from "HEAD~1" --output-dir "."
# combines the sfdx-git-delta package.xml with the package found in the commit message, overwriting the commit message package
if [[ "$PACKAGE_FOUND" == "True" ]]; then
    sf sfpc combine -f "package/package.xml" -f "$DEPLOY_PACKAGE" -c "$DEPLOY_PACKAGE"
fi
```

## Issues

If you encounter issues, [open a GitHub issue](https://github.com/mcarvin8/sf-package-combiner/issues) and include:  

- The exact command run  
- A sample of your `package.xml` files (if possible)  
- Any error messages or logs

## License

This project is licensed under the MIT license. Please see the [LICENSE](https://raw.githubusercontent.com/mcarvin8/sf-package-combiner/main/LICENSE.md) file for details.
