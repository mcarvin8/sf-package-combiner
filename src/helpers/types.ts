export type SfpcCombineResult = {
  path: string;
};

export type PackageTypeObject = {
  name: string;
  members: string[];
};

export type PackageXmlObject = {
  Package: {
    '@_xmlns'?: string;
    types: PackageTypeObject[];
    version?: string;
  };
};
