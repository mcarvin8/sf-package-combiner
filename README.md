# sf-package-combiner

[![NPM](https://img.shields.io/npm/v/sf-package-combiner.svg?label=sf-package-combiner)](https://www.npmjs.com/package/sf-package-combiner) [![Downloads/week](https://img.shields.io/npm/dw/sf-package-combiner.svg)](https://npmjs.org/package/sf-package-combiner) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/sf-package-combiner/main/LICENSE.txt)

A Salesforce CLI plugin to combine multiple manifest files (package.xml) into 1 file that can be used for deployments.

When the packages are combined, the `<name>` tags with the metadata name will be converted to lower-case, ex: `<name>customobject</name>`. This ensures that multiple members of the same metadata name are grouped together in the combined package. The `<name>` tags are case insensitive when read by the Salesforce CLI. However, the `<members>` tags are case sensitive and must match the cases to match their API names in Salesforce. This tool will not convert the `<members>` cases, just the `<name>` tags.

The combined package.xml will use the maximum `<version>` tag found in all packages. If none of the packages provided have `<version>`, it will omit this from the combined package.xml. When you deploy a package.xml without an API version, it will check the `sfdx-project.json` file for the `sourceApiVersion`. If both files do not have an API version, it will default to the max API version available in the target org.

## Install

```bash
sf plugins install sf-package-combiner@x.y.z
```

## Commands

<!-- commands -->

- [`sf sfpc combine`](#sf-sfpc-combine)

## `sf sfpc combine`

Combine Salesforce manifest files together.

```
USAGE
  $ sf sfpc combine [--json] [-f <value>]

FLAGS
  -f, --package-file=<value> The path to an existing package.xml file. This flag can be specified multiple times.
  -c, --combined-package=<value> The path to save the combined package.xml to.
                                 Default name is "combinedPackage.xml" in the running directory.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Combine multiple package files into 1 file.

EXAMPLES
  Combine pack1.xml and pack2.xml into package.xml

    $ sf sfpc combine -f pack1.xml -f pack2.xml -c package.xml
```

<!-- commandsstop -->
