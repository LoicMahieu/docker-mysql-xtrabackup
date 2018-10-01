
/* tslint:disable no-unused-expression */

import yargs from "yargs";
import { run as runBackup } from "./backup";
import { run as runExtract } from "./extract";
import { run as runPrepare } from "./prepare";

yargs
  .usage("$0 <cmd> [args]")

  .option("gcloudBackupPath", { type: "string", required: true })
  .option("gcloudServiceAccountKey", {
    type: "string",
  })
  .option("gcloudServiceAccountFile", {
    type: "string",
  })

  .command("backup", "Run backup", (cmdArgs: yargs.Argv) => {
    return cmdArgs
      .option("mysqlDataDirectory", {
        default: process.env.MYSQL_DATA_DIRECTORY || "/var/lib/mysql",
        type: "string",
      })
      .option("mysqlHost", {
        default: process.env.MYSQL_HOST || "127.0.0.1",
        type: "string",
      })
      .option("mysqlPassword", {
        default: process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || "",
        type: "string",
      })
      .option("mysqlPort", {
        default: process.env.MYSQL_PORT || 3306,
        type: "number",
      })
      .option("mysqlUser", {
        default: process.env.MYSQL_USER || "root",
        type: "string",
      })

      .option("backupDirectory", {
        default: process.env.BACKUP_DIRECTORY || "/backup",
        type: "string",
      })
      .option("backupMaxAge", {
        default: 2,
        describe: "In day",
        type: "number",
      });
  }, (args) => {
    runBackup(args);
  })

  .command("prepare", "Run prepare", (cmdArgs: yargs.Argv) => {
    return cmdArgs
      .option("mysqlDataDirectory", {
        default: process.env.MYSQL_DATA_DIRECTORY || "/var/lib/mysql",
        type: "string",
      })
      .option("mysqlPassword", {
        default: process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || "",
        type: "string",
      })
      .option("mysqlUser", {
        default: process.env.MYSQL_USER || "root",
        type: "string",
      })

      .option("tempDirectory", {
        type: "string",
      })

      .option("gcloudBackupPath", {
        required: true,
        type: "string",
      });
  }, (args) => {
    runPrepare(args);
  })

  .command("extract", "Run extract", (cmdArgs: yargs.Argv) => {
    return cmdArgs
      .option("tempDirectory", {
        type: "string",
      })

      .option("gcloudBackupPath", {
        required: true,
        type: "string",
      });
  }, (args) => {
    runExtract(args);
  })

  .help()
  .demandCommand(1, "You need at least one command")
  .showHelpOnFail(true)
  .argv;
