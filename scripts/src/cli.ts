
import yargs from "yargs";
import { run } from "./backup";

const argv =  yargs
  .usage("$0 <cmd> [args]")

  .command("backup", "Run backup", (cmdArgs: yargs.Argv) => {
    return cmdArgs
      .option("mysqlUser", { type: "string" })
      .option("mysqlPassword", { type: "string" })
      .option("mysqlHost", { type: "string" })
      .option("mysqlPort", { type: "string" })
      .option("mysqlDataDirectory", { type: "string" })

      .option("gcloudServiceAccountKey?", { type: "string" })
      .option("gcloudServiceAccountFile?", { type: "string" })
      .option("gcloudBackupPath", { type: "string" })

      .option("backupDirectory", { type: "string" })
      .option("backupMaxAge", { type: "string" });
  })

  .help()
  .argv;

run(argv);
