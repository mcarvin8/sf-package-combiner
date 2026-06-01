import { describe, it, expect } from 'vitest';
import { getConcurrencyThreshold } from '../../src/utils/getConcurrencyThreshold.js';

describe('getConcurrencyThreshold', () => {
  it('returns a value no greater than 6', () => {
    expect(getConcurrencyThreshold()).toBeLessThanOrEqual(6);
  });

  it('returns a positive number', () => {
    expect(getConcurrencyThreshold()).toBeGreaterThan(0);
  });
});
