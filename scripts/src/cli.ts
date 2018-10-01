
/* tslint:disable no-unused-expression */

import yargs from "yargs";
import { run as runBackup } from "./backup";
import { run as runExtract } from "./extract";
import { run as runPrepare } from "./prepare";

yargs
  .usage("$0 <cmd> [args]")

  .option("gcloudServiceAccountKey", { type: "string" })
  .option("gcloudServiceAccountFile", { type: "string" })

  .command("backup", "Run backup", (cmdArgs: yargs.Argv) => {
    return cmdArgs
      .option("mysqlUser", { type: "string" })
      .option("mysqlPassword", { type: "string" })
      .option("mysqlHost", { type: "string" })
      .option("mysqlPort", { type: "string" })
      .option("mysqlDataDirectory", { type: "string" })

      .option("gcloudBackupPath", { type: "string" })

      .option("backupDirectory", { type: "string" })
      .option("backupMaxAge", { type: "string" });
  }, (args) => {
    runBackup(args);
  })

  .command("prepare", "Run prepare", (cmdArgs: yargs.Argv) => {
    return cmdArgs
      .option("gcloudBackupPath", { type: "string" });
  }, (args) => {
    runPrepare(args);
  })

  .command("extract", "Run extract", (cmdArgs: yargs.Argv) => {
    return cmdArgs
      .option("gcloudBackupPath", { type: "string" });
  }, (args) => {
    runExtract(args);
  })

  .help()
  .demandCommand(1, "You need at least one command")
  .showHelpOnFail(true)
  .argv;
