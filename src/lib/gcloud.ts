import { Bucket, File, Storage } from "@google-cloud/storage";
import execa from "execa";
import fs from "fs-extra";
import tempy from "tempy";
import url from "url";
import { IBaseOptions } from "../base-options";
import { log } from "./log";

interface ISetupGCloudOptions {
  gcloudServiceAccountFile?: string;
  gcloudServiceAccountKey?: string;
}

export async function setupGCloud(options: ISetupGCloudOptions) {
  if (options.gcloudServiceAccountFile) {
    await execa("gcloud", [
      "auth",
      "activate-service-account",
      `--key-file=${options.gcloudServiceAccountFile}`,
    ]);
    process.env.GOOGLE_APPLICATION_CREDENTIALS =
      options.gcloudServiceAccountFile;
  } else if (options.gcloudServiceAccountKey) {
    const keyFile = tempy.file();
    await fs.writeFile(
      keyFile,
      Buffer.from(options.gcloudServiceAccountKey, "base64").toString()
    );
    await execa("gcloud", [
      "auth",
      "activate-service-account",
      `--key-file=${keyFile}`,
    ]);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFile;
  }
}

export async function rsync(options: IBaseOptions, from: string, to: string) {
  const baseArgs = [];
  if (!options.gsutilRsyncVerbose) {
    baseArgs.push("-q");
  }
  if (options.gsutilRsyncParallel) {
    baseArgs.push("-m");
  }

  const gsutilArgs = [...baseArgs, "rsync", "-d", "-r", from, to];
  const command = {
    args: gsutilArgs,
    file: "gsutil",
  };

  if (options.gsutilRsyncIonice) {
    const value =
      typeof options.gsutilRsyncIonice === "number"
        ? options.gsutilRsyncIonice
        : 10;
    command.args = ["-n", "+" + value, command.file, ...command.args];
    command.file = "nice";
  }

  if (options.gsutilRsyncNice) {
    const value =
      typeof options.gsutilRsyncNice === "number" ? options.gsutilRsyncNice : 3;
    command.args = ["-c" + value, command.file, ...command.args];
    command.file = "ionice";
  }

  console.log(`$ ${command.file} ${command.args.join(" ")}`);

  await execa(command.file, command.args, {
    stdio: "inherit",
  });
}

function createBucket(directory: string) {
  const storage = new Storage();

  const gcloudUrl = url.parse(directory);
  if (!gcloudUrl.hostname || !gcloudUrl.path) {
    throw new Error("Invalid `gcloudBackupPath`");
  }

  const bucketName = gcloudUrl.hostname;
  const bucket = storage.bucket(bucketName);
  const prefix = gcloudUrl.path.replace(/^\//, "");

  return { bucket, bucketName, prefix };
}

export async function deleteDirectory(directory: string) {
  const { bucket, prefix } = createBucket(directory);
  log("Delete directory gs://%s/%s", directory);
  await bucket.deleteFiles({ prefix });
}

export async function getDirectories(directory: string) {
  const { bucket, prefix } = createBucket(directory);
  const getFiles = makeGetFiles(bucket);

  const {
    apiResponse: { prefixes: directoriesPath = [] } = {},
  } = await getFiles({
    autoPaginate: false,
    delimiter: "/",
    prefix,
  });
  const directories = directoriesPath.map((dir) =>
    dir.replace(prefix, "").replace(/\/$/, "")
  );

  return directories;
}

const makeGetFiles = (bucket: Bucket) => (query: any) =>
  new Promise<{
    files?: File[];
    nextQuery?: any;
    apiResponse?: { prefixes: string[] };
  }>((resolve, reject) => {
    bucket.getFiles(query, (err, files, nextQuery, apiResponse: any) => {
      if (err) {
        reject(err);
      } else {
        resolve({ files, nextQuery, apiResponse });
      }
    });
  });

export async function directoryExists(directory: string) {
  const name = directory.replace(/\/$/, "").split("/").pop() || "";
  const parent =
    directory.replace(/\/$/, "").split("/").slice(0, -1).join("/") + "/";

  const parentDirectories = await getDirectories(parent);
  const found = parentDirectories.indexOf(name) >= 0;

  return found;
}
