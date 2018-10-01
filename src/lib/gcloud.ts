
import execa from "execa";
import fs from "fs-extra";
import tempy from "tempy";

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
