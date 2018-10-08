
/* tslint:disable no-unused-expression */

import tempy from "tempy";
import yargs from "yargs";
import { run as runBackup } from "./backup";
import { list as backupList } from "./backupList";
import { validateOptions } from "./base-options";
import { clean } from "./clean";
import { run as runExtract } from "./extract";
import { consoleHr, printOptions } from "./lib/cli";
import { log } from "./lib/log";
import { triggerWebhook } from "./lib/webhook";
import { run as runPrepare } from "./prepare";
import { restore } from "./restore";

const createJob = (jobFn: (args: any) => Promise<any>) => async (args: any) => {
  const hrstart = process.hrtime();
  printOptions(args);
  consoleHr();

  let inError = false;

  try {
    validateOptions(args);
    const jobResult = await jobFn(args);
    log("Job succeed!");

    if (args.postJobSuccessWebhook) {
      await triggerWebhook(args.postJobSuccessWebhook, {
        method: args.postJobSuccessWebhookMethod,
      }, jobResult);
    }
  } catch (err) {
    console.error("Job failed!");
    console.error(err);
    inError = true;
  }

  const hrend = process.hrtime(hrstart);

  log("Job execution time: %ds %dms", hrend[0], hrend[1] / 1000000);
  process.exit(inError ? 1 : 0);
};

yargs
  .usage("$0 <cmd> [args]")

  .option("gcloudBackupPath", { type: "string", required: true })
  .option("gcloudServiceAccountKey", {
    default: () => process.env.GCLOUD_SERVICE_ACCOUNT_KEY,
    type: "string",
  })
  .option("gcloudServiceAccountFile", {
    default: process.env.GCLOUD_SERVICE_ACCOUNT_FILE,
    type: "string",
  })

  .option("gsutilRsyncParallel", {
    default: false,
    type: "boolean",
  })
  .option("gsutilRsyncVerbose", {
    default: false,
    type: "boolean",
  })

  .option("postJobSuccessWebhook", {
    type: "string",
  })
  .option("postJobSuccessWebhookMethod", {
    default: "POST",
    type: "string",
  })

  .command("clean", "", (cmdArgs: yargs.Argv) =>
    cmdArgs
      .option("backupMaxAge", {
        default: 2,
        describe: "In day",
        type: "number",
      })
  , createJob(clean))

  .command("restore", "", (cmdArgs: yargs.Argv) =>
    cmdArgs
      .option("mysqlDataDirectory", {
        default: process.env.MYSQL_DATA_DIRECTORY || "/var/lib/mysql",
        type: "string",
      })
  , createJob(restore))

  .command("backup", "", (cmdArgs: yargs.Argv) =>
    cmdArgs
      .command("list", "List backups", (runArgs: yargs.Argv) => runArgs, createJob(backupList))
      .command(["$0", "run"], "Run backup", (runArgs: yargs.Argv) =>
        runArgs.option("mysqlDataDirectory", {
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

        .option("xtrabackupDatabasesExclude", {
          default: [],
          type: "array",
        })
      , createJob(runBackup)),
  )

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
