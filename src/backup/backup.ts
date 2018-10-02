
import { format } from "date-fns";
import execa from "execa";
import fs from "fs-extra";
import path from "path";
import { IOptions } from ".";

export async function runBackup(options: IOptions) {
  const backupName = format(new Date(), "YYYY-MM-DD");

  const currentBackupDirectory = path.join(options.backupDirectory, backupName);
  await fs.ensureDir(currentBackupDirectory);

  const fullBackupDirectory = path.join(currentBackupDirectory, "full");
  const fullBackupExists = await fs.pathExists(fullBackupDirectory);

  const lastIncBackup = await findIncrementalLastBackup(currentBackupDirectory);
  const newIncrementalBackupDirectory = path.join(currentBackupDirectory, "inc-" + format(new Date(), "HH-mm-ss"));

  const xtrabackupBaseArgs = [
    `--datadir=${options.mysqlDataDirectory}`,
    `--user=${options.mysqlUser}`,
    `--password=${options.mysqlPassword}`,
    `--host=${options.mysqlHost}`,
    `--port=${options.mysqlPort}`,
  ];
  if (options.xtrabackupDatabasesExclude) {
    xtrabackupBaseArgs.push(`--databases-exclude=${options.xtrabackupDatabasesExclude.join(" ")}`);
  }

  if (lastIncBackup) {
    console.log("Found a previous incremental backup: " + lastIncBackup);
    console.log("Start incremental backup in: " + newIncrementalBackupDirectory);
    await xtrabackup([
      ...xtrabackupBaseArgs,
      `--backup`,
      `--target-dir=${newIncrementalBackupDirectory}`,
      `--incremental-basedir=${lastIncBackup}`,
    ]);
  } else if (fullBackupExists) {
    console.log("Found full backup: " + fullBackupDirectory);
    console.log("Start incremental backup in: " + newIncrementalBackupDirectory);
    await xtrabackup([
      ...xtrabackupBaseArgs,
      `--backup`,
      `--target-dir=${newIncrementalBackupDirectory}`,
      `--incremental-basedir=${fullBackupDirectory}`,
    ]);
  } else {
    console.log("Could not find last full backup.");
    console.log("Start full backup in: " + fullBackupDirectory);
    await xtrabackup([
      ...xtrabackupBaseArgs,
      `--backup`,
      `--target-dir=${fullBackupDirectory}`,
    ]);
  }

  return backupName;
}

async function findIncrementalLastBackup(directoryPath: string) {
  if (!await fs.pathExists(directoryPath)) {
    return;
  }
  const files = (await fs.readdir(directoryPath))
    .filter((file) => file.match(/^inc-/));
  if (!files.length) {
    return;
  }
  return path.join(directoryPath, files[files.length - 1]);
}

async function xtrabackup(args: string[]) {
  return execa("xtrabackup", args, { stdio: "inherit" });
}
