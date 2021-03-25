import fs, { mkdirp, pathExists } from "fs-extra";
import { join } from "path";
import { IOptions } from ".";
import { log } from "../lib/log";
import { targz } from "../lib/targz";

export async function runCompress(options: IOptions) {
  const directories = await fs.readdir(options.backupDirectory);

  for (const dir of directories) {
    const backups = await fs.readdir(join(options.backupDirectory, dir));

    for (const backup of backups) {
      const targzFile = join(
        options.backupCompressDirectory,
        dir,
        backup + ".tar.gz"
      );

      if (pathExists(targzFile)) {
        log(`Skip ${targzFile} since already exists`);
      } else {
        log(`Start building ${targzFile}...`);
        await mkdirp(join(options.backupCompressDirectory, dir));
        await targz(targzFile, join(options.backupDirectory, dir), backup);
        log(`Done`);
      }
    }
  }
}
