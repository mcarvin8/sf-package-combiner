export type SfpcCombineResult = {
  path: string;
};

export type SalesforcePackageXml = {
  Package: {
    types: Array<{
      name: string;
      members: string[];
    }>;
    version?: string;
  };
};
