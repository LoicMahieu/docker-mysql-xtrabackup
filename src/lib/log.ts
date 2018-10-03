
import util from "util";

export function log(...logs: any[]) {
  process.stderr.write(util.format(logs[0], ...logs.slice(1)) + "\n");
}
