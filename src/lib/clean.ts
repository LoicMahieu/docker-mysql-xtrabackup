import { addDays, isBefore, isValid, parse } from "date-fns";

export function filterExpiredBackupDirectories(
  backupMaxAge: number,
  backupMin: number | undefined,
  directories: string[],
): string[] {
  const maxDate = addDays(new Date(), backupMaxAge * -1);
  const dirs = backupMin ? directories.slice(0, -1 * backupMin) : directories;
  const filteredDirectories = dirs.filter((file) => {
    const date = parse(file);
    return isValid(date) && isBefore(date, maxDate);
  });
  return filteredDirectories;
}
