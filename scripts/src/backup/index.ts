
import { IBaseOptions } from "../base-options";
import { consoleHr } from "../lib/cli";
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
  consoleHr();
  await setupGCloud(options);
  consoleHr();
  await runBackup(options);
  consoleHr();
  await runClean(options);
  consoleHr();
  await runSync(options);
  consoleHr();
}
