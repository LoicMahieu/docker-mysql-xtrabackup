
import { runBackup } from "./backup";
import { runClean } from "./clean";
import { setupGCloud } from "./gcloud";
import { runSync } from "./sync";

export interface IOptions {
  mysqlUser: string;
  mysqlRootPassword: string;
  mysqlHost: string;
  mysqlPort: string;
  mysqlDataDirectory: string;

  gcloudServiceAccountKey?: string;
  gcloudServiceAccountFile?: string;
  gcloudBackupPath: string;

  backupDirectory: string;
}

const defaultOptions: IOptions = {
  mysqlUser: process.env.MYSQL_USER || "root",
  mysqlRootPassword: process.env.MYSQL_ROOT_PASSWORD || "",
  mysqlHost: process.env.MYSQL_HOST || "127.0.0.1",
  mysqlPort: process.env.MYSQL_PORT || "3306",
  mysqlDataDirectory: process.env.MYSQL_DATA_DIRECTORY || "/var/lib/mysql",

  gcloudServiceAccountKey: process.env.GCLOUD_SERVICE_ACCOUNT_KEY,
  gcloudServiceAccountFile: process.env.GCLOUD_SERVICE_ACCOUNT_FILE,
  gcloudBackupPath: process.env.GCLOUD_BACKUP_PATH || "",

  backupDirectory: process.env.BACKUP_DIRECTORY || "/backup",
};

export async function run(args: any) {
  console.time("job");

  const options = createOptions(args);
  validateOptions(options);

  await setupGCloud(options);
  await runBackup(options);
  await runClean(options);
  await runSync(options);

  console.log("Job finished!");
  console.timeEnd("job");
}

function createOptions(args: any): IOptions {
  return {
    ...defaultOptions,
    ...args,
  };
}

function validateOptions(options: IOptions) {
  if (!options.gcloudBackupPath) {
    throw new Error('Options `gcloudBackupPath` is mandatory.')
  }
}
