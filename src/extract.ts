import { IBaseOptions } from "./base-options";
import { consoleHr } from "./lib/cli";
import { convertToSQL, copyPreparedBackup, IExtractOptions } from "./lib/extract";
import { rsync, setupGCloud } from "./lib/gcloud";

export type IExtractTaskOptions = {
  preparedBackupDirectory: string;
  gcloudTargetPath: string;
} & IExtractOptions &
  IBaseOptions;

export async function run(options: IExtractTaskOptions) {
  validateOptions(options);

  consoleHr();
  await setupGCloud(options);
  consoleHr();
  await copyPreparedBackup(options.preparedBackupDirectory, options.mysqlDataDirectory);
  consoleHr();
  await convertToSQL(options);
  consoleHr();
  await upload(options);
  consoleHr();
}

function validateOptions(options: IExtractTaskOptions) {
  if (!options.preparedBackupDirectory) {
    throw new Error("Options `preparedBackupDirectory` is mandatory.");
  }
  if (!options.gcloudTargetPath) {
    throw new Error("Options `gcloudTargetPath` is mandatory.");
  }
}

async function upload(options: IExtractTaskOptions) {
  await rsync(options, options.tempDirectory, options.gcloudTargetPath);
}
