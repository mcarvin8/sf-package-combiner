<!-- markdownlint-disable MD024 MD025 -->
<!-- markdown-link-check-disable -->

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.1](https://github.com/mcarvin8/sf-package-combiner/compare/v2.0.0...v2.0.1) (2025-01-18)


### Bug Fixes

* remove awaits in loops ([f9cbe61](https://github.com/mcarvin8/sf-package-combiner/commit/f9cbe617cbec4eb7d7d2b9a39f2c7e99d7ae1743))

## [2.0.0](https://github.com/mcarvin8/sf-package-combiner/compare/v1.2.3...v2.0.0) (2025-01-11)


### ⚠ BREAKING CHANGES

* format of `--api-version` parameter and add boolean flag

### Features

* format of `--api-version` parameter and add boolean flag ([fc2f969](https://github.com/mcarvin8/sf-package-combiner/commit/fc2f9698def64abb6c8d766bbe9d0397c4532f58))

## [1.2.3](https://github.com/mcarvin8/sf-package-combiner/compare/v1.2.2...v1.2.3) (2024-12-10)


### Bug Fixes

* add types/node peer dependency ([98f5c81](https://github.com/mcarvin8/sf-package-combiner/commit/98f5c818924ac63afa48a305ff8f0ccedc620d95))
* allow packages with no `<types>` to be parsed ([fcbf1ec](https://github.com/mcarvin8/sf-package-combiner/commit/fcbf1ecfd3b051c40432cbb7a9fc807af30a8137))

## [1.2.2](https://github.com/mcarvin8/sf-package-combiner/compare/v1.2.1...v1.2.2) (2024-12-10)


### Bug Fixes

* warn instead of fail when file or directory does not exist ([e6dd8a4](https://github.com/mcarvin8/sf-package-combiner/commit/e6dd8a465b9cf6232fd05fbcb02b312511522db0))

## [1.2.1](https://github.com/mcarvin8/sf-package-combiner/compare/v1.2.0...v1.2.1) (2024-11-27)


### Bug Fixes

* restrict `api-version` flag to positive numbers or 0 ([a726c73](https://github.com/mcarvin8/sf-package-combiner/commit/a726c73098b6529112b09dbd33d67c23d5fe4ed8))

## [1.2.0](https://github.com/mcarvin8/sf-package-combiner/compare/v1.1.0...v1.2.0) (2024-11-22)


### Features

* add optional `api-version` flag ([ff05d2e](https://github.com/mcarvin8/sf-package-combiner/commit/ff05d2e47c5f2fe7277ef715365b7728d3a5f865))

## [1.1.0](https://github.com/mcarvin8/sf-package-combiner/compare/v1.0.8...v1.1.0) (2024-11-20)


### Features

* add directory flag to read XMLs in immediate directory ([f43ae18](https://github.com/mcarvin8/sf-package-combiner/commit/f43ae18aa096713df4ae910e879c204f6551edbf))


### Bug Fixes

* change default value for combined package to `package.xml` ([6c43cd6](https://github.com/mcarvin8/sf-package-combiner/commit/6c43cd6d908bd6ce57fdbb824048b3fc0420963d))

## [1.0.8](https://github.com/mcarvin8/sf-package-combiner/compare/v1.0.7...v1.0.8) (2024-11-18)


### Bug Fixes

* check xml namespace in each package ([9c99e1c](https://github.com/mcarvin8/sf-package-combiner/commit/9c99e1cc97f64a4fdb175d2883b8926734c2e2e1))
* **deps:** bump @salesforce/core from 8.6.4 to 8.8.0 ([88d0f29](https://github.com/mcarvin8/sf-package-combiner/commit/88d0f29bec7f1e2aa569fe0f50eb1766ff37d823))

## [1.0.7](https://github.com/mcarvin8/sf-package-combiner/compare/v1.0.6...v1.0.7) (2024-11-15)


### Bug Fixes

* switch to fast-xml-parser ([a7fd1e9](https://github.com/mcarvin8/sf-package-combiner/commit/a7fd1e92a01673b2224afa9e9fdbfa331a0b85cf))

## [1.0.6](https://github.com/mcarvin8/sf-package-combiner/compare/v1.0.5...v1.0.6) (2024-11-14)


### Bug Fixes

* update indenting to 4 spaces and adjust empty package creation ([b0acb98](https://github.com/mcarvin8/sf-package-combiner/commit/b0acb9839f1169e7479efb18bebb69d7837f5108))

## [1.0.5](https://github.com/mcarvin8/sf-package-combiner/compare/v1.0.4...v1.0.5) (2024-11-13)


### Bug Fixes

* ensure only 1 `<name>` element is in each `<types>` ([c452034](https://github.com/mcarvin8/sf-package-combiner/commit/c45203463501bc66c1180ee75974607d9cfb037e))
* ensure only elements in each `types` element are `name` and `members` ([2ab6e60](https://github.com/mcarvin8/sf-package-combiner/commit/2ab6e60341d7b49308a01dbb541f9b9a8751effd))

## [1.0.4](https://github.com/mcarvin8/sf-package-combiner/compare/v1.0.3...v1.0.4) (2024-11-12)


### Bug Fixes

* enforce package root elements are `<types>` and `<version>` ([d0414fe](https://github.com/mcarvin8/sf-package-combiner/commit/d0414fe028141b6563b19976b5252d71aa829965))

## [1.0.3](https://github.com/mcarvin8/sf-package-combiner/compare/v1.0.2...v1.0.3) (2024-11-12)


### Bug Fixes

* enforce maximum of 1 version element in each package ([48a87de](https://github.com/mcarvin8/sf-package-combiner/commit/48a87debcbb289d48c1a63d42b01e592883f8fdc))

## [1.0.2](https://github.com/mcarvin8/sf-package-combiner/compare/v1.0.1...v1.0.2) (2024-11-10)


### Bug Fixes

* sort types by name and sort members in each type alphabetically ([e86ecca](https://github.com/mcarvin8/sf-package-combiner/commit/e86eccae25d0db6418ddfe3cddde0f85289806bc))

## [1.0.1](https://github.com/mcarvin8/sf-package-combiner/compare/v1.0.0...v1.0.1) (2024-11-10)


### Bug Fixes

* include namespace in combined package ([c6ae896](https://github.com/mcarvin8/sf-package-combiner/commit/c6ae896e1ef870259c47a09b6fd84a2cb2d7653e))

## 1.0.0 (2024-11-10)

### Features

- init release ([c18b562](https://github.com/mcarvin8/sf-package-combiner/commit/c18b56299a88a06c88fe7cd7cc883fe9a505eb2e))
