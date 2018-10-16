
import fs from "fs-extra";
import tempy from "tempy";
import { IBaseOptions } from "./base-options";
import { consoleHr } from "./lib/cli";
import { deleteDirectory, directoryExists, getDirectories, rsync, setupGCloud } from "./lib/gcloud";
import { log } from "./lib/log";
import { prepare } from "./lib/prepare";

export interface IPrepareAutoOptions extends IBaseOptions {
  gcloudTargetPath: string;
}

export async function run(options: IPrepareAutoOptions) {
  if (!options.gcloudTargetPath) {
    throw new Error("Options `gcloudTargetPath` is mandatory.");
  }

  consoleHr();
  await setupGCloud(options);
  consoleHr();

  const directories = await getDirectories(options.gcloudBackupPath);
  log("Found directories:", directories);

  const backupDirectories = directories.slice(0, -1);
  log("Use directories:", backupDirectories);

  for (const dir of backupDirectories) {
    const backupDir = options.gcloudBackupPath + dir + "/";
    const targetDir = options.gcloudTargetPath + dir + "/";

    log("=====");
    log("Backup: ", backupDir);
    log("Target: ", targetDir);

    if (await directoryExists(targetDir)) {
      log("Skip target exists");
    } else {
      log("Start prepare");
      await prepareBackup(options, backupDir, targetDir);
    }
  }
}

async function prepareBackup(options: IPrepareAutoOptions, from: string, to: string) {
  const tmpDir = tempy.file();
  await fs.ensureDir(tmpDir);
  await rsync(options, from, tmpDir);
  await prepare(tmpDir);
  if (options.dryRun) {
    log("Dry run: sync %s => %s", tmpDir, to);
  } else {
    await rsync(options, tmpDir + "/full", to);
  }
  if (options.dryRun) {
    log("Dry run: delete %s", from);
  } else {
    await deleteDirectory(from);
  }

  await fs.remove(tmpDir);
}
