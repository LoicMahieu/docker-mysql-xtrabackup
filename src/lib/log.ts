import util from "util";

export function log(...logs: any[]) {
  console.log(util.format(logs[0], ...logs.slice(1)));
}
