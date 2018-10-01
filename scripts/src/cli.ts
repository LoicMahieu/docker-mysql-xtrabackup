
import * as yargs from "yargs";
import { run } from ".";

const argv =  yargs
  .usage("$0 [args]")

  .option("mysqlUser", { type: "string" })
  .option("mysqlRootPassword", { type: "string" })
  .option("mysqlHost", { type: "string" })
  .option("mysqlPort", { type: "string" })
  .option("mysqlDataDirectory", { type: "string" })

  .option("gcloudServiceAccountKey?", { type: "string" })
  .option("gcloudServiceAccountFile?", { type: "string" })
  .option("gcloudBackupPath", { type: "string" })

  .option("backupDirectory", { type: "string" })
  .option("backupMaxAge", { type: "string" })

  .help()
  .argv;

run(argv);
