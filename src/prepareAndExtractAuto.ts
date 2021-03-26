import fs from "fs-extra";
import tempy from "tempy";
import { getBackupName } from "./backup/backup";
import { IBaseOptions } from "./base-options";
import { consoleHr } from "./lib/cli";
import {
  convertToSQL,
  copyPreparedBackup,
  IExtractOptions,
} from "./lib/extract";
import {
  directoryExists,
  getDirectories,
  rsync,
  setupGCloud,
} from "./lib/gcloud";
import { log } from "./lib/log";
import { prepare } from "./lib/prepare";

export type IPrepareAutoOptions = {
  gcloudTargetPath: string;
} & IExtractOptions & IBaseOptions;

export async function run(options: IPrepareAutoOptions) {
  if (!options.gcloudTargetPath) {
    throw new Error("Options `gcloudTargetPath` is mandatory.");
  }

  consoleHr();
  await setupGCloud(options);
  consoleHr();

  const directories = await getDirectories(options.gcloudBackupPath);
  log("Found directories:", directories);

  const backupDirectories = directories
    .filter((v) => v !== getBackupName())
    .slice(-1);
  log("Use directories:", backupDirectories);

  for (const dir of backupDirectories) {
    const backupDir = options.gcloudBackupPath + "/" + dir + "/";
    const targetDir = options.gcloudTargetPath + "/" + dir + "/";

    log("=====");
    log("Backup: ", backupDir);
    log("Target: ", targetDir);

    if (await directoryExists(targetDir)) {
      log("Skip target exists");
    } else {
      log("Start prepare");
      await prepareAndExtract(options, backupDir, targetDir);
    }
  }
}

async function prepareAndExtract(
  options: IPrepareAutoOptions,
  from: string,
  to: string
) {
  const tmpDir = tempy.file();
  await fs.ensureDir(tmpDir);
  await rsync(options, from, tmpDir);
  await prepare(tmpDir);
  await copyPreparedBackup(tmpDir + "/full", options.mysqlDataDirectory);
  await convertToSQL(options);
  await rsync(options, tmpDir + "/full", to);
  await fs.remove(tmpDir);
}
