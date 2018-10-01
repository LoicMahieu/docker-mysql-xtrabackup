
/* tslint:disable no-unused-expression */

import tempy from "tempy";
import yargs from "yargs";
import { run as runBackup } from "./backup";
import { run as runExtract } from "./extract";
import { printOptions } from "./lib/cli";
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
    console.time("job");
    printOptions(args);
    runBackup(args);
    console.log("Job finished!");
    console.timeEnd("job");
  })

  .command("prepare", "Run prepare", (cmdArgs: yargs.Argv) => {
    return cmdArgs
      .option("tempDirectory", {
        default: () => tempy.directory(),
        type: "string",
      })

      .option("gcloudTargetPath", {
        default: process.env.GCLOUD_TARGET_PATH || "",
        required: true,
        type: "string",
      });
  }, (args) => {
    console.time("job");
    printOptions(args);
    runPrepare(args);
    console.log("Job finished!");
    console.timeEnd("job");
  })

  .command("extract", "Run extract", (cmdArgs: yargs.Argv) => {
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
        default: () => tempy.directory(),
        type: "string",
      })

      .option("gcloudTargetPath", {
        default: process.env.GCLOUD_TARGET_PATH || "",
        required: true,
        type: "string",
      });
  }, (args) => {
    console.time("job");
    printOptions(args);
    runExtract(args);
    console.log("Job finished!");
    console.timeEnd("job");
  })

  .help()
  .demandCommand(1, "You need at least one command")
  .showHelpOnFail(true)
  .argv;
