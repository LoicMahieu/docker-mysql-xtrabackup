import fs, { mkdirp, pathExists } from "fs-extra";
import { join } from "path";
import { IOptions } from ".";
import { log } from "../lib/log";
import { targz } from "../lib/targz";

export async function runCompress(options: IOptions, backupName: string) {
  const backups = await fs.readdir(join(options.backupDirectory, backupName));

  for (const backup of backups) {
    const targzFile = join(
      options.backupCompressDirectory,
      backupName,
      backup + ".tar.gz"
    );

    if (await pathExists(targzFile)) {
      log(`Skip ${targzFile} since already exists`);
    } else {
      log(`Start building ${targzFile}...`);
      await mkdirp(join(options.backupCompressDirectory, backupName));
      await targz(targzFile, join(options.backupDirectory, backupName), backup);
      log(`Done`);
    }
  }
}
