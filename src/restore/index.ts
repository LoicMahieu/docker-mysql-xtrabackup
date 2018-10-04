
import execa from "execa";
import fs from "fs-extra";
import { IBaseOptions } from "../base-options";
import { consoleHr } from "../lib/cli";
import { setupGCloud } from "../lib/gcloud";

export interface IRestoreOptions extends IBaseOptions {
  mysqlDataDirectory: string;
}

export async function restore(options: any) {
  consoleHr();
  await setupGCloud(options);
  consoleHr();
  await downloadBackups(options);
  consoleHr();
}

async function downloadBackups(options: IRestoreOptions) {
  await fs.ensureDir(options.mysqlDataDirectory);
  await execa("gsutil", [
    "-m",
    "rsync",
    "-d",
    "-r",
    options.gcloudBackupPath,
    options.mysqlDataDirectory,
  ], { stdio: "inherit" });
}
