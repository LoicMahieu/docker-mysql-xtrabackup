
import { IBaseOptions } from "../base-options";
import { consoleHr, printOptions } from "../lib/cli";
import { setupGCloud } from "../lib/gcloud";
import { runBackup } from "./backup";
import { runClean } from "./clean";
import { runSync } from "./sync";
export interface IOptions extends IBaseOptions {
  mysqlDataDirectory: string;
  mysqlUser: string;
  mysqlPassword: string;
  mysqlHost: string;
  mysqlPort: string;

  backupDirectory: string;
  backupMaxAge: number;
}

export async function run(options: any) {
  console.time("job");

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

function validateOptions(options: IOptions) {
  if (!options.gcloudBackupPath) {
    throw new Error("Options `gcloudBackupPath` is mandatory.");
  }
  if (!options.gcloudServiceAccountKey && !options.gcloudServiceAccountFile) {
    throw new Error("Options `gcloudServiceAccountKey` or `gcloudServiceAccountFile` is mandatory.");
  }
}
