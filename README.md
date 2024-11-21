# sf-package-combiner

[![NPM](https://img.shields.io/npm/v/sf-package-combiner.svg?label=sf-package-combiner)](https://www.npmjs.com/package/sf-package-combiner) [![Downloads/week](https://img.shields.io/npm/dw/sf-package-combiner.svg)](https://npmjs.org/package/sf-package-combiner) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/sf-package-combiner/refs/heads/main/LICENSE.md)

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

- [Install](#install)
- [Command](#command)
  - [`sf-sfpc-combine`](#sf-sfpc-combine)
- [How the Packages Are Combined](#how-the-packages-are-combined)
- [Salesforce Package Structure](#salesforce-package-structure)
- [Parsing Strings with Package Contents](#parsing-strings-with-package-contents)
- [Issues](#issues)
- [License](#license)
</details>

A Salesforce CLI plugin to combine multiple manifest files (package.xml) into 1 file that can be used for deployments.

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
  $ sf sfpc combine [-f <value>] [-d <value>] [-c <value>] [--json]

FLAGS
  -f, --package-file=<value>     The path to an existing package.xml file. 
                                 This flag can be specified multiple times.
  -d, --directory=<value>        The path to an existing directory with package.xml files. 
                                 Only XML files in the immediate directory will be scanned.
                                 This flag can be specified multiple times.
  -c, --combined-package=<value> The path to save the combined package.xml to.
                                 If this value matches one of the input packages, it will overwrite the file.
                                 Default name is "package.xml" in the running directory.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Combine multiple package files into 1 file.

EXAMPLES
  Combine pack1.xml and pack2.xml into package.xml

    $ sf sfpc combine -f pack1.xml -f pack2.xml -c package.xml

  Combine pack1.xml, pack2.xml, and a directory with package XML files into package.xml

    $ sf sfpc combine -f pack1.xml -f pack2.xml -d "test/sample_dir" -c package.xml
```

<!-- commandsstop -->

## How the Packages Are Combined

When the packages are combined, the `<name>` elements with the metadata name will be converted to lower-case, ex: `<name>customobject</name>`. This ensures that multiple members of the same metadata name are grouped together in the combined package and that duplicate members are only declared once. The `<name>` elements are case insensitive when read by the Salesforce CLI. However, the `<members>` elements are case sensitive and their cases must match their API names in Salesforce. This tool will not convert the cases of the `<members>` elements, just the `<name>` elements.

The combined package.xml will use the maximum `<version>` tag found in all packages. If none of the packages provided have `<version>`, it will omit this from the combined package.xml. When you deploy a package.xml without an API version, it will check the `sfdx-project.json` file for the `sourceApiVersion`. If both files do not have an API version, it will follow the [sourceApiVersion: Order of Precedence](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_apiversion.htm).

The packages provided must match the expected Salesforce package.xml structure. If you provide an XML which doesn't match the expected structure, it will print this warning and not add it to the output:

```
Warning: File .\test\samples\pack2.xml does not match expected Salesforce package structure.
```

If all packages provided don't match the expected structure, the combined package.xml will be an empty package.

You can avoid deploying an empty package by searching the package for any `<types>` elements in it.

``` bash
# run deploy command only if the combined package contains metadata
sf sfpc -f package/package.xml -f package.xml -c package.xml
if grep -q '<types>' ./package.xml ; then
  echo "---- Deploying added and modified metadata ----"
  sf project deploy start -x package.xml
else
  echo "---- No changes to deploy ----"
fi
```

## Salesforce Package Structure

Salesforce packages follow this structure:

- `<Package xmlns="http://soap.sforce.com/2006/04/metadata">`: Root element must be `Package` with the Salesforce namespace.
    - `<types>`: This element defines a specific type of metadata component. It is used to group components of the same type, such as Apex classes, triggers, or Visualforce pages. Can be declared multiple times, but must be declared at least once.
      - `<members>`: Lists the individual components by their API names within that type. Multiple members can be included under the same type but at least 1 member must be declared in each `<types>`.
      - `<name>`: Specifies the type of metadata, such as "ApexClass", "ApexTrigger", or "CustomObject". Must be declared only once in each `<types>` element.
    - `<version>`: This optional element specifies the API version of Salesforce metadata that you are working with. It helps ensure compatibility between your metadata and the version of Salesforce you're interacting with. This can only be declared once.

## Parsing Strings with Package Contents

Currently, I'm working on a feature to allow strings containing package.xml contents to be accepted through the terminal using a new command flag.

Until that is implemented, you could use this simple shell script which could read a string stored in a variable which contains package.xml contents and create a temporary package.xml from that. That temporary package.xml then could be read by this plugin and overwritten as the combined package.

In my 1 use case, the `$COMMIT_MSG` variable is GitLab's predefined variable named `$CI_COMMIT_MESSAGE` which contains the commit message.

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
        echo "WARNING: Package.xml contents NOT found in the commit message."
    fi
    export PACKAGE_FOUND
}

build_package_from_commit "$COMMIT_MSG" "$DEPLOY_PACKAGE"

# combines the sfdx-git-delta package.xml with the package found in the commit message
if [[ "$PACKAGE_FOUND" == "True" ]]; then
    sf sfpc combine -f "package/package.xml" -f "$DEPLOY_PACKAGE" -c "$DEPLOY_PACKAGE"
fi
```

## Issues

If you encounter any issues, please create an issue in the repository's [issue tracker](https://github.com/mcarvin8/sf-package-combiner/issues).

## License

This project is licensed under the MIT license. Please see the [LICENSE](https://raw.githubusercontent.com/mcarvin8/sf-package-combiner/main/LICENSE.md) file for details.
