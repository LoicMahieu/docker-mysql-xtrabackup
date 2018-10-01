
/* tslint:disable no-unused-expression */

import tempy from "tempy";
import yargs from "yargs";
import { run as runBackup } from "./backup";
import { run as runExtract } from "./extract";
import { consoleHr, printOptions } from "./lib/cli";
import { triggerWebhook } from "./lib/webhook";
import { run as runPrepare } from "./prepare";

const createJob = (jobFn: (args: any) => Promise<any>) => async (args: any) => {
  console.time("job");
  printOptions(args);
  consoleHr();
  try {
    await jobFn(args);
    console.log("Job succeed!");

    if (args.postJobSuccessWebhook) {
      await triggerWebhook(args.postJobSuccessWebhook);
    }
  } catch (err) {
    console.error("Job failed!");
    console.error(err);
  } finally {
    console.timeEnd("job");
  }
};

yargs
  .usage("$0 <cmd> [args]")

  .option("gcloudBackupPath", { type: "string", required: true })
  .option("gcloudServiceAccountKey", {
    type: "string",
  })
  .option("gcloudServiceAccountFile", {
    type: "string",
  })

  .option("postJobSuccessWebhook", {
    type: "string",
  })

  .command("backup", "Run backup", (cmdArgs: yargs.Argv) => cmdArgs
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
    })
  , createJob(runBackup))

  .command("prepare", "Run prepare", (cmdArgs: yargs.Argv) => cmdArgs
    .option("tempDirectory", {
      default: () => tempy.directory(),
      type: "string",
    })

    .option("gcloudTargetPath", {
      default: process.env.GCLOUD_TARGET_PATH || "",
      required: true,
      type: "string",
    })
  , createJob(runPrepare))

  .command("extract", "Run extract", (cmdArgs: yargs.Argv) => cmdArgs
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
    })
  , createJob(runExtract))

  .help()
  .demandCommand(1, "You need at least one command")
  .showHelpOnFail(true)
  .argv;
