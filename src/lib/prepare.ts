import execa from "execa";
import { pathExists, readdir, remove } from "fs-extra";
import { join } from "path";
import { log } from "./log";
import { archiveExtention, archiveExtract } from "./targz";

const isArchive = (v: string) =>
  v.slice(-1 * archiveExtention.length) === archiveExtention;
const isIncremental = (v: string) => v.match(/^inc-/);

export async function prepare(tempDirectory: string) {
  const fullDir = join(tempDirectory, "full");
  const fullArchve = fullDir + archiveExtention;

  if (!(await pathExists(fullDir)) && (await pathExists(fullArchve))) {
    log(`Extract full archive...`);
    await archiveExtract(fullArchve, tempDirectory);
  }
  const incrementalArchives = (await readdir(tempDirectory))
    .filter(isIncremental)
    .filter(isArchive);
  for (const archive of incrementalArchives) {
    const incrementalDir = join(
      tempDirectory,
      archive.slice(0, -1 * archiveExtention.length)
    );
    if (!(await pathExists(incrementalDir))) {
      log(`Extract archive ${archive}...`);
      await archiveExtract(join(tempDirectory, archive), tempDirectory);
      log(`Remove archive ${archive}...`);
      await remove(join(tempDirectory, archive));
    }
  }

  log("Start apply log on FULL");
  await xtraBackupPrepare(fullDir);
  const incrementals = (await readdir(tempDirectory))
    .filter(isIncremental)
    .filter((v) => !isArchive(v));
  log(`Found ${incrementals.length} incrementas backups`, incrementals);

  for (const incremental of incrementals) {
    log("Start apply log on incremental: " + incremental);
    const incrementalDir = join(tempDirectory, incremental);
    await xtraBackupPrepare(fullDir, incrementalDir);
    log(`Remove incremental ${incremental}...`);
    await remove(incrementalDir);
  }
}

async function xtraBackupPrepare(targetDir: string, incrementalDir?: string) {
  await execa(
    "xtrabackup",
    [
      "--prepare",
      "--apply-log-only",
      `--target-dir=${targetDir}`,
      !incrementalDir ? "" : `--incremental-dir=${incrementalDir}`,
    ].filter(Boolean),
    { stdio: "inherit" }
  );
}
