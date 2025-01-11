# summary

Combine multiple package.xml files together.

# description

Read multiple package.xml files, then parse them and combine them to create 1 final package for deployments.

# examples

- sf sfpc combine -f pack1.xml -f pack2.xml -c package.xml
- sf sfpc combine -f pack1.xml -d "test/directory" -c package.xml
- sf sfpc combine -f packag1.xml -f pack2.xml -v 60.0 -c package.xml
- sf sfpc combine -f packag1.xml -f pack2.xml -c package.xml -n

# flags.package-file.summary

Path to a package.xml file.

# flags.combined-package.summary

Combined package file path.

# flags.directory.summary

Directory to look for package.xml files in.

# flags.api-version.summary

Sets the API version to use in the combined package.xml.

# flags.no-api-version.summary

Explicitly omit the API version in the combined package.xml.
