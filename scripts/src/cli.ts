
import * as yargs from "yargs";
import { run } from ".";

const argv =  yargs
  .option("mysqlUser", {})
  .option("mysqlRootPassword", {})
  .option("mysqlHost", {})
  .option("mysqlPort", {})
  .option("mysqlDataDirectory", {})

  .option("gcloudServiceAccountKey?", {})
  .option("gcloudServiceAccountFile?", {})
  .option("gcloudBackupPath", {})

  .option("backupDirectory", {})
  .option("backupMaxAge", {})
  .argv;

console.log(argv);

run(argv);
