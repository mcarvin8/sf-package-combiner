import { describe, expect, it } from 'vitest';
import { determineApiVersion } from '../../src/core/determineApiVersion.js';

describe('determineApiVersion', () => {
  it('returns undefined when noApiVersion is true', () => {
    expect(determineApiVersion(['61.0'], null, true)).toBeUndefined();
  });

  it('noApiVersion takes priority over userApiVersion', () => {
    expect(determineApiVersion([], '60.0', true)).toBeUndefined();
  });

  it('returns userApiVersion when provided (not null)', () => {
    expect(determineApiVersion(['59.0', '61.0'], '60.0', false)).toBe('60.0');
  });

  it('returns maximum version from apiVersions when userApiVersion is null', () => {
    expect(determineApiVersion(['59.0', '61.0', '60.0'], null, false)).toBe('61.0');
  });

  it('returns undefined when apiVersions is empty and userApiVersion is null', () => {
    expect(determineApiVersion([], null, false)).toBeUndefined();
  });

  it('returns the single version in the array', () => {
    expect(determineApiVersion(['59.0'], null, false)).toBe('59.0');
  });

  it('picks max over a lower initial accumulator', () => {
    expect(determineApiVersion(['61.0', '59.0'], null, false)).toBe('61.0');
  });
});
