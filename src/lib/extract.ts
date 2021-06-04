import execa from "execa";
import fs, { copy, mkdirp, move } from "fs-extra";
import pEvent, { Emitter } from "p-event";
import path from "path";
import zlib from "zlib";
import { log } from "./log";

const dontBackupDatabases = [
  "Database",
  "information_schema",
  "performance_schema",
  "mysql",
  "sys",
  "innodb",
];

export interface IExtractOptions {
  mysqlDataDirectory: string;
  mysqlUser: string;
  mysqlPassword: string;
  tempDirectory: string;
  movePreparedBackup?: boolean;
}

export async function copyPreparedBackup(
  from: string,
  mysqlDataDirectory: string,
  options: IExtractOptions
) {
  await fs.ensureDir(mysqlDataDirectory);
  if (options.movePreparedBackup) {
    log("Move prepared backup...");
    await move(from, mysqlDataDirectory);
  } else {
    log("Copy prepared backup...");
    await copy(from, mysqlDataDirectory);
  }
}

export async function convertToSQL(options: IExtractOptions) {
  await mkdirp(options.tempDirectory);

  const mysql = execa("mysqld", [
    "-uroot",
    `--datadir=${options.mysqlDataDirectory}`,
  ]);

  if (!(mysql.stdout && mysql.stderr)) {
    throw new Error("Child process does not have std");
  }

  mysql.stderr.on("data", (data) => {
    log("stderr:", data.toString());
    if (data.toString().indexOf("ready for connections") >= 0) {
      mysql.stderr?.emit("__ready__");
    }
  });

  mysql.stdout.on("data", (data) => {
    log("stdout:", data.toString());
  });

  try {
    await pEvent(mysql.stderr, "__ready__");
    log("MySQL is ready!");

    log("Start mysql-dump for all databases...");
    const target = fs.createWriteStream(
      path.join(options.tempDirectory, "all-databases.sql.gz")
    );
    const backup = execa("mysqldump", [
      "--all-databases",
      `-u${options.mysqlUser}`,
      `-p${options.mysqlPassword}`,
    ]);
    if (!(backup.stdout && backup.stderr)) {
      throw new Error("Child process does not have std");
    }
    backup.stderr.pipe(process.stderr);
    backup.stdout.pipe(zlib.createGzip()).pipe(target);
    await pEvent(target as Emitter<any, any>, "finish");

    const databases = (
      await execa("mysql", [
        `-u${options.mysqlUser}`,
        `-p${options.mysqlPassword}`,
        "-s",
        "-N",
        "-e",
        "SHOW DATABASES",
      ])
    ).stdout
      .split("\n")
      .filter((database) => dontBackupDatabases.indexOf(database) < 0);

    for (const database of databases) {
      log(`Start mysql-dump for database "${database}" ...`);
      const databaseTarget = fs.createWriteStream(
        path.join(options.tempDirectory, database + ".sql.gz")
      );
      const databaseBackup = execa("mysqldump", [
        "--databases",
        database,
        `-u${options.mysqlUser}`,
        `-p${options.mysqlPassword}`,
      ]);

      if (!(databaseBackup.stdout && databaseBackup.stderr)) {
        throw new Error("Child process does not have std");
      }

      databaseBackup.stderr.pipe(process.stderr);
      databaseBackup.stdout.pipe(zlib.createGzip()).pipe(databaseTarget);
      await pEvent(databaseTarget as Emitter<any, any>, "finish");
    }
  } finally {
    const waitClose = pEvent(mysql, "close");
    mysql.kill();
    await waitClose;
  }
}
