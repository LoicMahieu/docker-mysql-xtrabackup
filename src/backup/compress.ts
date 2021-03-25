import fs, { mkdirp } from "fs-extra";
import { join } from "path";
import { IOptions } from ".";
import { targz } from "../lib/targz";

export async function runCompress(options: IOptions) {
  const directories = await fs.readdir(options.backupDirectory);

  await Promise.all(
    directories.map(async (dir) => {
      const backups = await fs.readdir(join(options.backupDirectory, dir));
      await Promise.all(
        backups.map(async (backup) => {
          await mkdirp(join(options.backupCompressDirectory, dir));
          await targz(
            join(options.backupCompressDirectory, dir, backup + ".tar.gz"),
            join(options.backupDirectory, dir),
            backup
          );
        })
      );
    })
  );
}
