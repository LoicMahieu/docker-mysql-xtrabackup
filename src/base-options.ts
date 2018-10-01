
export interface IBaseOptions {
  gcloudBackupPath: string;
  gcloudServiceAccountFile?: string;
  gcloudServiceAccountKey?: string;
}

export function validateOptions(options: IBaseOptions) {
  if (!options.gcloudBackupPath) {
    throw new Error("Options `gcloudBackupPath` is mandatory.");
  }
  if (!options.gcloudServiceAccountKey && !options.gcloudServiceAccountFile) {
    throw new Error("Options `gcloudServiceAccountKey` or `gcloudServiceAccountFile` is mandatory.");
  }
}
