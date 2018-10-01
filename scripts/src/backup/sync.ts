
import execa from "execa";
import { IOptions } from ".";

export async function runSync(options: IOptions) {
  await execa("gsutil", [
    "rsync",
    "-d",
    "-r",
    options.backupDirectory,
    options.gcloudBackupPath,
  ], { stdio: "inherit" });
}
