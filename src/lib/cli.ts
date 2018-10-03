import { log } from "./log";

export function consoleHr() {
  log("========================================================================================");
  log("");
  log("");
  log("");
  log("========================================================================================");
}

export function printOptions(options: any) {
  const keys = Object.keys(options);
  const protectedKeys = [
    "gcloudServiceAccountKey",
    "mysqlPassword",
  ];
  const hideKeys = [
    "_",
    "$0",
  ];

  log("Options:");
  keys
    .filter((key) => hideKeys.indexOf(key) < 0)
    .forEach((key) => {
      const value = protectedKeys.indexOf(key) >= 0 ? "******" : options[key];
      log(`${key}: `, value);
    });
}
