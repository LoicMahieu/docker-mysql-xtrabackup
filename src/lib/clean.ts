
import { addDays, isBefore, isValid, parse } from "date-fns";

export function filterExpiredBackupDirectories(backupMaxAge: number, directories: string[]): string[] {
  const maxDate = addDays(new Date(), backupMaxAge * -1);
  const filteredDirectories = directories
    .filter((file) => {
      const date = parse(file);
      return isValid(date) && isBefore(date, maxDate);
    });
  return filteredDirectories;
}
