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
  apiVersion: string;
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
  apiVersion: string;
};
