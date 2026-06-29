import * as nodeOs from 'node:os';
import { describe, expect, it, vi } from 'vitest';

import { getConcurrencyThreshold } from '../../src/utils/getConcurrencyThreshold.js';

vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>();
  return {
    ...actual,
    availableParallelism: vi.fn(() => actual.availableParallelism()),
  };
});

describe('getConcurrencyThreshold', () => {
  it('returns a value no greater than 6', () => {
    expect(getConcurrencyThreshold()).toBeLessThanOrEqual(6);
  });

  it('returns a positive number', () => {
    expect(getConcurrencyThreshold()).toBeGreaterThan(0);
  });

  it('caps result at 6 when system reports more than 6 available CPUs', () => {
    vi.mocked(nodeOs.availableParallelism).mockReturnValueOnce(8);
    expect(getConcurrencyThreshold()).toBe(6);
  });
});
