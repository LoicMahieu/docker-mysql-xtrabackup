
export function consoleHr() {
  console.log("========================================================================================");
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("========================================================================================");
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

  console.log("Options:");
  keys
    .filter((key) => hideKeys.indexOf(key) < 0)
    .forEach((key) => {
      const value = protectedKeys.indexOf(key) >= 0 ? "******" : options[key];
      console.log(`${key}: `, value);
    });
}
