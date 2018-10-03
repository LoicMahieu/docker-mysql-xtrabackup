
import { Bucket, File, Storage } from "@google-cloud/storage";
import execa from "execa";
import fs from "fs-extra";
import path from "path";
import tempy from "tempy";
import url from "url";
import { IOptions } from "../backup";
import { log } from "./log";

interface ISetupGCloudOptions {
  gcloudServiceAccountFile?: string;
  gcloudServiceAccountKey?: string;
}

export async function setupGCloud(options: ISetupGCloudOptions) {
  if (options.gcloudServiceAccountFile) {
    await execa("gcloud", [ "auth", "activate-service-account", `--key-file=${options.gcloudServiceAccountFile}` ]);
  } else if (options.gcloudServiceAccountKey) {
    const keyFile = tempy.file();
    await fs.writeFile(keyFile, Buffer.from(options.gcloudServiceAccountKey, "base64").toString());
    await execa("gcloud", [ "auth", "activate-service-account", `--key-file=${keyFile}` ]);
    await fs.remove(keyFile);
  }
}

function createBucket(options: IOptions) {
  const storage = new Storage();

  const gcloudUrl = url.parse(options.gcloudBackupPath);
  if (!gcloudUrl.hostname || !gcloudUrl.path) {
    throw new Error("Invalid `gcloudBackupPath`");
  }

  const bucketName = gcloudUrl.hostname;
  const bucket = storage.bucket(bucketName);
  const prefix = gcloudUrl.path.replace(/^\//, "");

  return { bucket, bucketName, prefix };
}

export async function deleteDirectory(options: IOptions, directory: string) {
  const { bucket, bucketName, prefix } = createBucket(options);
  log("Delete directory gs://%s/%s", bucketName, path.join(prefix, directory));
  await bucket.deleteFiles({
    prefix: path.join(prefix, directory),
  });
}

export async function getDirectories(options: IOptions) {
  const { bucket, prefix } = createBucket(options);
  const getFiles = makeGetFiles(bucket);

  const { apiResponse: { prefixes: directoriesPath = [] } = {} } = await getFiles({
    autoPaginate: false,
    delimiter: "/",
    prefix,
  });
  const directories = directoriesPath
    .map((directory) => directory.replace(prefix, "").replace(/\/$/, ""));

  return directories;
}

const makeGetFiles = (bucket: Bucket) => (query: any) =>
new Promise<{ files?: File[], nextQuery?: {}, apiResponse?: { prefixes: string[] } }>((resolve, reject) => {
  bucket.getFiles(query, (err, files, nextQuery, apiResponse: any) => {
    if (err) {
      reject(err);
    } else {
      resolve({ files, nextQuery, apiResponse });
    }
  });
});
