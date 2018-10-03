
import { IOptions } from "../backup";
import { getDirectories } from "../lib/gcloud";

export async function list(options: IOptions) {
  const directories = await getDirectories(options);
  directories.forEach((directory) => console.log(directory));
}
