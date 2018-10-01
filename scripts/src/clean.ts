
import { addDays, isBefore, isValid, parse } from "date-fns";
import fs from "fs-extra";
import path from "path";
import { IOptions } from ".";

export async function runClean(options: IOptions) {
  const files = await fs.readdir(options.backupDirectory);
  const filteredFiles = filterBackupDirectories(options, files);

  console.log("Found previous backup:");
  files.forEach((file) => {
    const shouldDelete = filteredFiles.indexOf(file) >= 0;
    console.log((shouldDelete ? "[DEL]" : "[KEEP]") + " " + file);
  });

  if (!filteredFiles.length) {
    console.log("There no previous backup to clean.");
  }

  await Promise.all(filteredFiles.map(async (file) => {
    const dirPath = path.join(options.backupDirectory, file);

    console.log("Remove previous backup: " + dirPath);
    await fs.remove(dirPath);
  }));
}

function filterBackupDirectories(options: IOptions, directories: string[]): string[] {
  const maxDate = addDays(new Date(), options.backupMaxAge * -1);
  const filteredDirectories = directories
    .filter((file) => {
      const date = parse(file);
      return isValid(date) && isBefore(date, maxDate);
    });
  return filteredDirectories;
}
