
import { consoleHr, printOptions } from "../lib/cli";
import { setupGCloud } from "../lib/gcloud";
import { runBackup } from "./backup";
import { runClean } from "./clean";
import { runSync } from "./sync";
export interface IOptions {
  mysqlDataDirectory: string;
  mysqlUser: string;
  mysqlPassword: string;
  mysqlHost: string;
  mysqlPort: string;

  gcloudBackupPath: string;
  gcloudServiceAccountFile?: string;
  gcloudServiceAccountKey?: string;

  backupDirectory: string;
  backupMaxAge: number;
}

const defaultOptions: IOptions = {
  mysqlDataDirectory: process.env.MYSQL_DATA_DIRECTORY || "/var/lib/mysql",
  mysqlHost: process.env.MYSQL_HOST || "127.0.0.1",
  mysqlPassword: process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || "",
  mysqlPort: process.env.MYSQL_PORT || "3306",
  mysqlUser: process.env.MYSQL_USER || "root",

  gcloudBackupPath: process.env.GCLOUD_BACKUP_PATH || "",
  gcloudServiceAccountFile: process.env.GCLOUD_SERVICE_ACCOUNT_FILE,
  gcloudServiceAccountKey: process.env.GCLOUD_SERVICE_ACCOUNT_KEY,

  backupDirectory: process.env.BACKUP_DIRECTORY || "/backup",
  backupMaxAge: 2,
};

export async function run(args: any) {
  console.time("job");

  const options = createOptions(args);
  validateOptions(options);

  consoleHr();
  printOptions(options);
  consoleHr();
  await setupGCloud(options);
  consoleHr();
  await runBackup(options);
  consoleHr();
  await runClean(options);
  consoleHr();
  await runSync(options);
  consoleHr();

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
    throw new Error("Options `gcloudBackupPath` is mandatory.");
  }
  if (!options.gcloudServiceAccountKey && !options.gcloudServiceAccountFile) {
    throw new Error("Options `gcloudServiceAccountKey` or `gcloudServiceAccountFile` is mandatory.");
  }
}
