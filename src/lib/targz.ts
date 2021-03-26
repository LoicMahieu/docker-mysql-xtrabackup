import execa from "execa";

export const archiveExtention = ".tar.gz";

export async function archiveCreate(
  archive: string,
  sourceDir: string,
  source: string
) {
  return execa("tar", ["-czf", archive, "-C", sourceDir, source], {
    stdio: "inherit",
  });
}

export async function archiveExtract(
  archive: string,
  target: string
) {
  return execa("tar", ["-xf", archive, "-C", target], {
    stdio: "inherit",
  });
}
