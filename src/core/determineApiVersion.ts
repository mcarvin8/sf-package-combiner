// Salesforce API versions are whole numbers written as `NN.0`. Same format check as
// @salesforce/core's validateApiVersion (/^[1-9]\d\.0$/), except it allows 3+ digits so it
// keeps working once Salesforce reaches 100.0.
const API_VERSION_PATTERN = /^[1-9]\d+\.0$/;

// Versions below this are retired. Matches minValidApiVersion in @salesforce/sf-plugins-core,
// which the CLI's --api-version flag enforces.
const MIN_API_VERSION = 21;

/**
 * Returns why `version` isn't a usable Salesforce API version, or undefined if it is.
 */
export function getApiVersionError(version: string): string | undefined {
  if (!API_VERSION_PATTERN.test(version)) {
    return `Invalid API version "${version}". Expected a format like "62.0".`;
  }
  if (Number.parseInt(version, 10) < MIN_API_VERSION) {
    return `API version ${version} is retired. The minimum supported version is ${MIN_API_VERSION}.0.`;
  }
  return undefined;
}

/**
 * Throws if `version` isn't a usable Salesforce API version.
 */
export function validateApiVersion(version: string): void {
  const error = getApiVersionError(version);
  if (error !== undefined) {
    throw new Error(error);
  }
}

export function determineApiVersion(
  apiVersions: string[],
  userApiVersion: string | null,
  noApiVersion: boolean,
): string | undefined {
  if (noApiVersion) return undefined;
  if (userApiVersion === null) {
    if (apiVersions.length === 0) return undefined;
    // Compare numerically: as strings, "100.0" sorts below "99.0".
    // Stryker disable next-line EqualityOperator -- >= produces the same result; ties are equal versions
    return apiVersions.reduce((max, version) => (Number.parseFloat(version) > Number.parseFloat(max) ? version : max));
  }
  return userApiVersion;
}
