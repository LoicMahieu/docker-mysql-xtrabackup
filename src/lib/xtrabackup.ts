import execa from "execa";

export async function xtrabackup(args: string[]) {
  return execa("xtrabackup", args, { stdio: "inherit" });
}
