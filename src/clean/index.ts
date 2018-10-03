
import { IOptions } from "../backup";
import { filterExpiredBackupDirectories } from "../lib/clean";
import { deleteDirectory, getDirectories } from "../lib/gcloud";

export interface ICleanOptions extends IOptions {
  backupMaxAge: number;
}

export async function clean(options: ICleanOptions) {
  const directories = await getDirectories(options);
  const directoriesToClean = filterExpiredBackupDirectories(options.backupMaxAge, directories);

  for (const directory of directoriesToClean) {
    console.log("Delete directory %s", directory);
    await deleteDirectory(options, directory);
  }
}
