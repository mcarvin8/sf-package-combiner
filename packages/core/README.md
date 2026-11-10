# sf-package-combiner-core

The programmatic API of [sf-package-combiner](https://github.com/mcarvin8/sf-package-combiner), published on its own with **no runtime dependencies**.

Use this package when you call the combiner from your own Node.js code (another CLI plugin, a script, a CI wrapper). Use [sf-package-combiner](https://www.npmjs.com/package/sf-package-combiner) for the Salesforce CLI plugin, and the [GitHub Action](https://github.com/marketplace/actions/sf-package-combiner) for GitHub workflows.

Both npm packages are built from the same source and released with the same version number. The API is identical.

```bash
npm install sf-package-combiner-core
```

```ts
import { combinePackages } from 'sf-package-combiner-core';

const result = await combinePackages({
  packageFiles: ['package1.xml', 'package2.xml'],
  directories: ['manifests/'],
  combinedPackage: 'package.xml',
  warn: (msg) => console.warn(msg),
});

console.log(`${result.types} types, ${result.members} members -> ${result.path}`);
```

The package is ESM-only and needs Node.js 22.19 or later. See [Programmatic API](https://github.com/mcarvin8/sf-package-combiner#programmatic-api) for every option and the result shape.

## License

MIT
