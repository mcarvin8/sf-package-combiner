import { describe, expect, it } from 'vitest';
import { determineApiVersion, getApiVersionError, validateApiVersion } from '../../src/core/determineApiVersion.js';

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

  it('compares numerically, not as strings', () => {
    expect(determineApiVersion(['99.0', '100.0'], null, false)).toBe('100.0');
    expect(determineApiVersion(['100.0', '99.0'], null, false)).toBe('100.0');
  });
});

describe('getApiVersionError', () => {
  it.each(['21.0', '62.0', '100.0'])('accepts %s', (version) => {
    expect(getApiVersionError(version)).toBeUndefined();
  });

  it.each(['62', '62.1', '62.0.0', 'v62.0', ' 62.0', '62.0 ', '06.0', '6e1.0', '', 'abc'])(
    'rejects malformed %j',
    (version) => {
      expect(getApiVersionError(version)).toBe(`Invalid API version "${version}". Expected a format like "62.0".`);
    },
  );

  it.each(['10.0', '20.0'])('rejects retired %s', (version) => {
    expect(getApiVersionError(version)).toBe(
      `API version ${version} is retired. The minimum supported version is 21.0.`,
    );
  });
});

describe('validateApiVersion', () => {
  it('does not throw for a valid version', () => {
    expect(() => validateApiVersion('62.0')).not.toThrow();
  });

  it('throws the validation message', () => {
    expect(() => validateApiVersion('20.0')).toThrow(
      'API version 20.0 is retired. The minimum supported version is 21.0.',
    );
    expect(() => validateApiVersion('62')).toThrow('Invalid API version "62". Expected a format like "62.0".');
  });
});
