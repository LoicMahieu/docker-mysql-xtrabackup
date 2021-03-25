import execa from "execa";
import fs from "fs-extra";
import path from "path";
import { log } from "./log";

export async function prepare(tempDirectory: string) {
  const files = await fs.readdir(tempDirectory);
  const incrementals = files.filter((file) => file.match(/^inc-/));
  const fullDir = path.join(tempDirectory, "full");

  log("Start apply log on FULL");
  await xtraBackupPrepare(fullDir);
  for (const incremental of incrementals) {
    log("Start apply log on incremental: " + incremental);
    await xtraBackupPrepare(fullDir, path.join(tempDirectory, incremental));
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
