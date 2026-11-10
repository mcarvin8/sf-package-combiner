import { describe, expect, it } from 'vitest';

import * as api from '../src/index.js';

describe('public API', () => {
  it('exposes combinePackages as the only runtime export', () => {
    expect(Object.keys(api)).toEqual(['combinePackages']);
  });

  it('combines manifests without the CLI', async () => {
    const warnings: string[] = [];
    const result = await api.combinePackages({
      packageFiles: ['test/samples/package-account-only.xml', 'test/samples/package-custom-label.xml'],
      dryRun: true,
      warn: (msg) => warnings.push(msg),
    });

    expect(result.path).toBeNull();
    expect(result.dryRun).toBe(true);
    expect(result.filesProcessed).toBe(2);
    expect(result.types).toBeGreaterThan(0);
    expect(warnings).toEqual([]);
  });

  it('accepts no options', async () => {
    const result = await api.combinePackages({ dryRun: true });
    expect(result.filesProcessed).toBe(0);
    expect(result.types).toBe(0);
  });
});
