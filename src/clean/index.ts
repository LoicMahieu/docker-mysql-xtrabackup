
import { IOptions } from "../backup";
import { filterExpiredBackupDirectories } from "../lib/clean";
import { deleteDirectory, getDirectories, setupGCloud } from "../lib/gcloud";
import { log } from "../lib/log";

export interface ICleanOptions extends IOptions {
  backupMaxAge: number;
}

export async function clean(options: ICleanOptions) {
  await setupGCloud(options);

  const directories = await getDirectories(options);
  const directoriesToClean = filterExpiredBackupDirectories(options.backupMaxAge, directories);

  log("Found directories:");
  directories.forEach((directory) => {
    const shouldDelete = directoriesToClean.indexOf(directory) >= 0;
    log((shouldDelete ? "[DEL]" : "[KEEP]") + " " + directory);
  });

  for (const directory of directoriesToClean) {
    log("Delete directory %s", directory);
    await deleteDirectory(options, directory);
  }
}
