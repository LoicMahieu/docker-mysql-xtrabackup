
import { IOptions } from ".";
import { rsync } from "../lib/gcloud";

export async function runSync(options: IOptions) {
  await rsync(options, options.backupDirectory, options.gcloudBackupPath);
}
