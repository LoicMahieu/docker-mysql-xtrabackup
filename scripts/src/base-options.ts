
export interface IBaseOptions {
  gcloudBackupPath: string;
  gcloudServiceAccountFile?: string;
  gcloudServiceAccountKey?: string;
}

export const defaultBaseOptions: IBaseOptions = {
  gcloudBackupPath: process.env.GCLOUD_BACKUP_PATH || "",
  gcloudServiceAccountFile: process.env.GCLOUD_SERVICE_ACCOUNT_FILE,
  gcloudServiceAccountKey: process.env.GCLOUD_SERVICE_ACCOUNT_KEY,
};
