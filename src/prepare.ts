
import execa from "execa";
import path from "path";
import { IBaseOptions } from "./base-options";
import { consoleHr } from "./lib/cli";
import { rsync, setupGCloud } from "./lib/gcloud";
import { prepare } from "./lib/prepare";

export interface IPrepareOptions extends IBaseOptions {
  tempDirectory: string;

  gcloudTargetPath: string;
}

export async function run(options: IPrepareOptions) {
  validateOptions(options);

  consoleHr();
  await setupGCloud(options);
  consoleHr();
  await downloadBackups(options);
  consoleHr();
  await prepare(options.tempDirectory);
  consoleHr();
  await upload(options);
  consoleHr();
}

function validateOptions(options: IPrepareOptions) {
  if (!options.gcloudTargetPath) {
    throw new Error("Options `gcloudTargetPath` is mandatory.");
  }
}

async function downloadBackups(options: IPrepareOptions) {
  await rsync(options, options.gcloudBackupPath, options.tempDirectory);
}

export async function upload(options: IPrepareOptions) {
  const fullDir = path.join(options.tempDirectory, "full");
  await execa("gsutil", [
    "-m",
    "rsync",
    "-d",
    "-r",
    fullDir,
    options.gcloudTargetPath,
  ], { stdio: "inherit" });
}
