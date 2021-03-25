import fs from "fs-extra";
import path from "path";
import { IOptions } from ".";
import { filterExpiredBackupDirectories } from "../lib/clean";
import { log } from "../lib/log";

async function cleanDirectory(
  logPrefix: string,
  backupDirectory: string,
  options: IOptions
) {
  const files = await fs.readdir(backupDirectory);
  const filteredFiles = filterExpiredBackupDirectories(
    options.backupMaxAge,
    options.backupMin,
    files
  );

  log(logPrefix, "Found previous backup:");
  files.forEach((file) => {
    const shouldDelete = filteredFiles.indexOf(file) >= 0;
    log(logPrefix, (shouldDelete ? "[DEL]" : "[KEEP]") + " " + file);
  });

  if (!filteredFiles.length) {
    log(logPrefix, "There no previous backup to clean.");
  }

  await Promise.all(
    filteredFiles.map(async (file) => {
      const dirPath = path.join(backupDirectory, file);

      log(logPrefix, "Remove previous backup: " + dirPath);
      await fs.remove(dirPath);
    })
  );
}

export async function runClean(options: IOptions) {
  await cleanDirectory("Backup directory: ", options.backupDirectory, options);
  await cleanDirectory(
    "Compress backup directory: ",
    options.backupCompressDirectory,
    options
  );
}
