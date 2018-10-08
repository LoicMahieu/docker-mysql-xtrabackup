
export interface IBaseOptions {
  gcloudBackupPath: string;
  gcloudServiceAccountFile?: string;
  gcloudServiceAccountKey?: string;

  gsutilRsyncParallel: boolean;
  gsutilRsyncVerbose: boolean;
}

export function validateOptions(options: IBaseOptions) {
  if (!options.gcloudBackupPath) {
    throw new Error("Options `gcloudBackupPath` is mandatory.");
  }
}
