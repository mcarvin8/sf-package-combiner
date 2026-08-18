export function determineApiVersion(
  apiVersions: string[],
  userApiVersion: string | null,
  noApiVersion: boolean,
): string | undefined {
  if (noApiVersion) return undefined;
  if (userApiVersion === null) {
    if (apiVersions.length === 0) return undefined;
    // Stryker disable next-line EqualityOperator -- >= produces the same result; reduce finds same max string regardless of tie-breaking
    return apiVersions.reduce((max, version) => (version > max ? version : max));
  }
  return userApiVersion;
}
