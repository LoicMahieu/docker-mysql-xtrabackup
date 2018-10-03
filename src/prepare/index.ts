
import execa from "execa";
import fs from "fs-extra";
import path from "path";
import { IBaseOptions } from "../base-options";
import { consoleHr } from "../lib/cli";
import { setupGCloud } from "../lib/gcloud";
import { log } from "../lib/log";

export interface IPrepareOptions extends IBaseOptions {
  tempDirectory: string;

  gcloudTargetPath: string;
}

export async function run(options: any) {
  validateOptions(options);

  consoleHr();
  await setupGCloud(options);
  consoleHr();
  await downloadBackups(options);
  consoleHr();
  await prepare(options);
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
  await fs.ensureDir(options.tempDirectory);
  await execa("gsutil", [
    "-m",
    "rsync",
    "-d",
    "-r",
    options.gcloudBackupPath,
    options.tempDirectory,
  ], { stdio: "inherit" });
}

async function prepare(options: IPrepareOptions) {
  const files = await fs.readdir(options.tempDirectory);
  const incrementals = files.filter((file) => file.match(/^inc-/));
  const fullDir = path.join(options.tempDirectory, "full");

  log("Start apply log on FULL");
  await xtraBackupPrepare(fullDir);
  for (const incremental of incrementals) {
    log("Start apply log on incremental: " + incremental);
    await xtraBackupPrepare(fullDir, path.join(options.tempDirectory, incremental));
  }
}

async function xtraBackupPrepare(targetDir: string, incrementalDir?: string) {
  await execa("xtrabackup", [
    "--prepare",
    "--apply-log-only",
    `--target-dir=${targetDir}`,
    !incrementalDir ? "" : `--incremental-dir=${incrementalDir}`,
  ].filter(Boolean), { stdio: "inherit" });
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
