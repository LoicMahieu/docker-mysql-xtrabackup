
import execa from "execa";
import fs from "fs-extra";
import tempy from "tempy";
import { consoleHr, printOptions } from "../lib/cli";
import { setupGCloud } from "../lib/gcloud";

export interface IPrepareOptions {
  backupName: string;
  tempDirectory: string;

  gcloudBackupPath?: string;
  gcloudServiceAccountFile?: string;
  gcloudServiceAccountKey?: string;
}

const defaultOptions: IPrepareOptions = {
  backupName: "",
  tempDirectory: tempy.directory(),

  gcloudBackupPath: process.env.GCLOUD_BACKUP_PATH,
  gcloudServiceAccountFile: process.env.GCLOUD_SERVICE_ACCOUNT_FILE,
  gcloudServiceAccountKey: process.env.GCLOUD_SERVICE_ACCOUNT_KEY,
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
  if (!options.backupName) {
    throw new Error("Options `backupName` is mandatory.");
  }
  if (!options.gcloudBackupPath) {
    throw new Error("Options `gcloudBackupPath` is mandatory.");
  }
  if (!options.gcloudServiceAccountKey && !options.gcloudServiceAccountFile) {
    throw new Error("Options `gcloudServiceAccountKey` or `gcloudServiceAccountFile` is mandatory.");
  }
}

async function downloadBackups(options: IPrepareOptions) {
  await fs.ensureDir(options.tempDirectory);
  await execa("gsutil", [
    "rsync",
    "-d",
    "-r",
    options.gcloudBackupPath + "/" + options.backupName,
    options.tempDirectory,
  ], { stdio: "inherit" });
}

async function prepare(options: IPrepareOptions) {
  const files = await fs.readdir(options.tempDirectory);
  console.log(files);
}
