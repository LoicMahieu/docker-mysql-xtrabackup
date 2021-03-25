import execa from "execa";

export async function targz(
  archive: string,
  sourceDir: string,
  source: string
) {
  return execa("tar", ["-czf", archive, "-C", sourceDir, source], {
    stdio: "inherit",
  });
}
