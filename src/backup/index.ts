import { IBaseOptions } from "../base-options";
import { consoleHr } from "../lib/cli";
import { rsync, setupGCloud } from "../lib/gcloud";
import { runBackup } from "./backup";
import { runClean } from "./clean";
import { runCompress } from "./compress";

export interface IOptions extends IBaseOptions {
  mysqlDataDirectory: string;
  mysqlUser: string;
  mysqlPassword: string;
  mysqlHost: string;
  mysqlPort: string;

  backupDirectory: string;
  backupCompressDirectory: string;
  backupMaxAge: number;
  backupMin?: number;

  xtrabackupDatabasesExclude?: string[];
}

export async function run(options: any) {
  consoleHr();
  await setupGCloud(options);
  consoleHr();
  const backupName = await runBackup(options);
  consoleHr();
  await runClean(options);
  consoleHr();
  await runCompress(options, backupName);
  consoleHr();
  await runSync(options, backupName);
  consoleHr();

  return {
    backupName,
  };
}

export async function runSync(options: IOptions, backupName: string) {
  await rsync(
    options,
    options.backupCompressDirectory + "/" + backupName,
    options.gcloudBackupPath + "/" + backupName
  );
}
