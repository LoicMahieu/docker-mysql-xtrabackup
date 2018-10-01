
import execa from "execa";
import fs from "fs-extra";
import pEvent, { Emitter } from "p-event";
import path from "path";
import tempy from "tempy";
import zlib from "zlib";
import { defaultBaseOptions, IBaseOptions } from "../base-options";
import { consoleHr, printOptions } from "../lib/cli";
import { setupGCloud } from "../lib/gcloud";

const dontBackupDatabases = [
  "Database",
  "information_schema",
  "performance_schema",
  "mysql",
  "sys",
  "innodb",
];

export interface IExtractOptions extends IBaseOptions {
  mysqlDataDirectory: string;
  mysqlUser: string;
  mysqlPassword: string;

  tempDirectory: string;

  gcloudTargetPath: string;
}

const defaultOptions: IExtractOptions = {
  ...defaultBaseOptions,

  mysqlDataDirectory: process.env.MYSQL_DATA_DIRECTORY || "/var/lib/mysql",
  mysqlPassword: process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || "",
  mysqlUser: process.env.MYSQL_USER || "root",

  tempDirectory: tempy.directory(),

  gcloudTargetPath: process.env.GCLOUD_TARGET_PATH || "",
};

export async function run(args: any) {
  console.time("job");

  const options = createOptions(args);
  validateOptions(options);

  consoleHr();
  printOptions(options);
  consoleHr();
  await setupGCloud(options);
  consoleHr();
  await downloadBackups(options);
  consoleHr();
  await convertToSQL(options);
  consoleHr();
  await upload(options);
  consoleHr();

  console.log("Job finished!");
  console.timeEnd("job");
}

function createOptions(args: any): IExtractOptions {
  return {
    ...defaultOptions,
    ...args,
  };
}

function validateOptions(options: IExtractOptions) {
  if (!options.gcloudBackupPath) {
    throw new Error("Options `gcloudBackupPath` is mandatory.");
  }
  if (!options.gcloudTargetPath) {
    throw new Error("Options `gcloudTargetPath` is mandatory.");
  }
  if (!options.gcloudServiceAccountKey && !options.gcloudServiceAccountFile) {
    throw new Error("Options `gcloudServiceAccountKey` or `gcloudServiceAccountFile` is mandatory.");
  }
}

async function downloadBackups(options: IExtractOptions) {
  await fs.ensureDir(options.mysqlDataDirectory);
  await execa("gsutil", [
    "-m",
    "rsync",
    "-d",
    "-r",
    options.gcloudBackupPath,
    options.mysqlDataDirectory,
  ], { stdio: "inherit" });
}

async function convertToSQL(options: IExtractOptions) {
  const mysql = execa("mysqld", ["-uroot"]);

  mysql.stderr.on("data", (data) => {
    console.log("stderr:", data.toString());
    if (data.toString().indexOf("ready for connections") >= 0) {
      mysql.stderr.emit("__ready__");
    }
  });

  mysql.stdout.on("data", (data) => {
    console.log("stdout:", data.toString());
  });

  try {
    await pEvent(mysql.stderr, "__ready__");
    console.log("MySQL is ready!");

    console.log("Start mysql-dump for all databases...");
    const target = fs.createWriteStream(path.join(options.tempDirectory, "all-databases.sql.gz"));
    const backup = execa("mysqldump", [
      "--all-databases",
      `-u${options.mysqlUser}`,
      `-p${options.mysqlPassword}`,
    ]);
    backup.stdout.pipe(zlib.createGzip()).pipe(target);
    await pEvent(target as Emitter<any, any>, "finish");

    const databases = (await execa("mysql", [
      `-u${options.mysqlUser}`,
      `-p${options.mysqlPassword}`,
      "-s",
      "-N",
      "-e",
      "SHOW DATABASES",
    ]))
      .stdout.split("\n")
      .filter((database) => dontBackupDatabases.indexOf(database) < 0);

    for (const database of databases) {
      console.log(`Start mysql-dump for database "${database}" ...`);
      const databaseTarget = fs.createWriteStream(path.join(options.tempDirectory, database + ".sql.gz"));
      const databaseBackup = execa("mysqldump", [
        "--databases",
        database,
        `-u${options.mysqlUser}`,
        `-p${options.mysqlPassword}`,
      ]);
      databaseBackup.stdout.pipe(zlib.createGzip()).pipe(databaseTarget);
      await pEvent(databaseTarget as Emitter<any, any>, "finish");
    }
  } finally {
    mysql.kill();
  }
}

export async function upload(options: IExtractOptions) {
  await execa("gsutil", [
    "-m",
    "rsync",
    "-d",
    "-r",
    options.tempDirectory,
    options.gcloudTargetPath,
  ], { stdio: "inherit" });
}
