import { IBaseOptions } from "./base-options";
import { consoleHr } from "./lib/cli";
import { rsync, setupGCloud } from "./lib/gcloud";
import { prepare } from "./lib/prepare";

export interface IPrepareOptions extends IBaseOptions {
  tempDirectory: string;
}

export async function run(options: IPrepareOptions) {
  consoleHr();
  await setupGCloud(options);
  consoleHr();
  await downloadBackups(options);
  consoleHr();
  await prepare(options.tempDirectory);
  consoleHr();
}

async function downloadBackups(options: IPrepareOptions) {
  await rsync(options, options.gcloudBackupPath, options.tempDirectory);
}
