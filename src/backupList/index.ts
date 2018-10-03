
import { Bucket, File, Storage } from "@google-cloud/storage";
import url from "url";
import { IOptions } from "../backup";

export async function list(options: IOptions) {
  const storage = new Storage();

  const gcloudUrl = url.parse(options.gcloudBackupPath);
  if (!gcloudUrl.hostname || !gcloudUrl.path) {
    throw new Error("Invalid `gcloudBackupPath`");
  }

  const bucket = storage.bucket(gcloudUrl.hostname);
  const prefix = gcloudUrl.path.replace(/^\//, "");
  const getFiles = makeGetFiles(bucket);

  const { apiResponse: { prefixes: directoriesPath = [] } = {} } = await getFiles({
    autoPaginate: false,
    delimiter: "/",
    prefix,
  });
  const directories = directoriesPath
    .map((directory) => directory.replace(prefix, "").replace(/\/$/, ""));

  directories.forEach((directory) => console.log(directory));
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
