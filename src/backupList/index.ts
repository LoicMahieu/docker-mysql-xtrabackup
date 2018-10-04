
import { IOptions } from "../backup";
import { getDirectories, setupGCloud } from "../lib/gcloud";

export async function list(options: IOptions) {
  await setupGCloud(options);

  const directories = await getDirectories(options);
  directories.forEach((directory) => console.log(directory));
}
