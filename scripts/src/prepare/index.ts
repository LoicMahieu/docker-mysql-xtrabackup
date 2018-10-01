
import execa from "execa";
import fs from "fs-extra";
import path from "path";
import tempy from "tempy";
import { defaultBaseOptions, IBaseOptions } from "../base-options";
import { consoleHr, printOptions } from "../lib/cli";
import { setupGCloud } from "../lib/gcloud";

export interface IPrepareOptions extends IBaseOptions {
  tempDirectory: string;

  gcloudTargetPath: string;
}

const defaultOptions: IPrepareOptions = {
  ...defaultBaseOptions,

  tempDirectory: tempy.directory(),

  gcloudTargetPath: process.env.GCLOUD_TARGET_PATH || "",
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
  await downloadBackups(options);
  consoleHr();
  await prepare(options);
  consoleHr();
  await upload(options);
  consoleHr();

  console.log("Job finished!");
  console.timeEnd("job");
}

function createOptions(args: any): IPrepareOptions {
  return {
    ...defaultOptions,
    ...args,
  };
}

function validateOptions(options: IPrepareOptions) {
  if (!options.gcloudBackupPath) {
    throw new Error("Options `gcloudBackupPath` is mandatory.");
  }
  if (!options.gcloudTargetPath) {
    throw new Error("Options `gcloudTargetPath` is mandatory.");
  }
  if (!options.gcloudServiceAccountKey && !options.gcloudServiceAccountFile) {
    throw new Error("Options `gcloudServiceAccountKey` or `gcloudServiceAccountFile` is mandatory.");
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

  console.log("Start apply log on FULL");
  await xtraBackupPrepare(fullDir);
  for (const incremental of incrementals) {
    console.log("Start apply log on incremental: " + incremental);
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
