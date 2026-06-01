export function determineApiVersion(
  apiVersions: string[],
  userApiVersion: string | null,
  noApiVersion: boolean
): string {
  if (noApiVersion) return '0.0';
  if (userApiVersion === null) {
    // Stryker disable next-line EqualityOperator -- >= produces the same result; reduce finds same max string regardless of tie-breaking
    return apiVersions.reduce((max, version) => (version > max ? version : max), '0.0');
  }
  return userApiVersion;
}
