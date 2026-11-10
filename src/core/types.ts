export type PackageManifestObject = {
  Package: {
    '@_xmlns': string;
    types: Array<{ name: string; members: string[] }>;
    version?: string;
  };
};

export type DuplicateMember = {
  type: string;
  member: string;
  files: string[];
};

export type MergePackageResult = {
  warnings: string[];
  types: number;
  members: number;
  duplicatesRemoved: number;
  duplicates: DuplicateMember[];
  membersByType: Record<string, number>;
  apiVersion?: string;
};

export type SfpcCombineResult = {
  path: string | null;
  dryRun: boolean;
  filesProcessed: number;
  types: number;
  members: number;
  duplicatesRemoved: number;
  duplicates: DuplicateMember[];
  membersByType: Record<string, number>;
  apiVersion?: string;
};

export type CombinePackagesOptions = {
  /** Paths to package.xml files to combine. */
  packageFiles?: string[];
  /** Output path for the combined package.xml. Defaults to `package.xml`. */
  combinedPackage?: string;
  /** Directories to scan (non-recursively) for package.xml files. */
  directories?: string[];
  /** API version for the combined manifest. Defaults to the highest version found in the inputs. */
  userApiVersion?: string | null;
  /** Omit `<version>` from the combined manifest. */
  noApiVersion?: boolean;
  /** Compute the result without writing the output file. */
  dryRun?: boolean;
  /** Called once per warning (invalid manifests, unreadable directories, etc.). */
  warn?: (msg: string) => void;
};
