import { describe, it, expect } from 'vitest';
import { determineApiVersion } from '../../src/core/determineApiVersion.js';

describe('determineApiVersion', () => {
  it('returns 0.0 when noApiVersion is true', () => {
    expect(determineApiVersion(['61.0'], null, true)).toBe('0.0');
  });

  it('noApiVersion takes priority over userApiVersion', () => {
    expect(determineApiVersion([], '60.0', true)).toBe('0.0');
  });

  it('returns userApiVersion when provided (not null)', () => {
    expect(determineApiVersion(['59.0', '61.0'], '60.0', false)).toBe('60.0');
  });

  it('returns maximum version from apiVersions when userApiVersion is null', () => {
    expect(determineApiVersion(['59.0', '61.0', '60.0'], null, false)).toBe('61.0');
  });

  it('returns initial 0.0 when apiVersions is empty and userApiVersion is null', () => {
    expect(determineApiVersion([], null, false)).toBe('0.0');
  });

  it('returns the single version in the array', () => {
    expect(determineApiVersion(['59.0'], null, false)).toBe('59.0');
  });

  it('picks max over a lower initial accumulator', () => {
    expect(determineApiVersion(['61.0', '59.0'], null, false)).toBe('61.0');
  });
});
