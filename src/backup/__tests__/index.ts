import { getBackupName, runBackup } from "../backup";
import { directory } from "tempy";
import yargs from "yargs";
import * as xtrabackup from "../../lib/xtrabackup";
import { mkdirp, readdir, writeFile } from "fs-extra";
import { join } from "path";
import { runClean } from "../clean";
import { runCompress } from "../compress";

jest.mock("../../lib/xtrabackup", () => ({
  xtrabackup: jest.fn(async (args) => {
    const { targetDir } = yargs(args).argv as any;
    await mkdirp(targetDir);
    await writeFile(join(targetDir, "some-file"), "foo");
  }),
}));

jest.useFakeTimers("modern");
jest.setSystemTime(new Date("04 Dec 1995 00:12:00 GMT").getTime());

const getOptions = () => {
  const backupDirectory = directory();
  const backupCompressDirectory = directory();
  return {
    mysqlDataDirectory: "/var/lib/mysql",
    mysqlUser: "",
    mysqlHost: "",
    mysqlPassword: "",
    mysqlPort: "",
    backupDirectory,
    backupCompressDirectory,
    backupMaxAge: 10,
    dryRun: false,
    gcloudBackupPath: "",
  };
};

describe("backup", () => {
  it("runBackup", async () => {
    const options = getOptions();
    const { backupDirectory } = options;

    await runBackup(options);

    expect(xtrabackup.xtrabackup).toHaveBeenCalledWith([
      "--datadir=/var/lib/mysql",
      "--user=",
      "--password=",
      "--host=",
      "--port=",
      "--backup",
      `--target-dir=${backupDirectory}/1995-12-04/full`,
    ]);
    expect(await tree(backupDirectory)).toMatchInlineSnapshot(`
      Array [
        Object {
          "dir": "1995-12-04",
          "files": Array [
            Object {
              "dir": "full",
              "files": Array [
                "some-file",
              ],
            },
          ],
        },
      ]
    `);

    await runBackup(options);

    expect(xtrabackup.xtrabackup).nthCalledWith(2, [
      "--datadir=/var/lib/mysql",
      "--user=",
      "--password=",
      "--host=",
      "--port=",
      "--backup",
      `--target-dir=${backupDirectory}/1995-12-04/inc-01-12-00`,
      `--incremental-basedir=${backupDirectory}/1995-12-04/full`,
    ]);
    expect(await tree(backupDirectory)).toMatchInlineSnapshot(`
      Array [
        Object {
          "dir": "1995-12-04",
          "files": Array [
            Object {
              "dir": "full",
              "files": Array [
                "some-file",
              ],
            },
            Object {
              "dir": "inc-01-12-00",
              "files": Array [
                "some-file",
              ],
            },
          ],
        },
      ]
    `);
  });

  it("runClean", async () => {
    const options = getOptions();
    const { backupDirectory, backupCompressDirectory } = options;

    await mkdirp(join(backupDirectory, "1995-12-04/full"));
    await writeFile(join(backupDirectory, "1995-12-04/full/bim"), "bar");

    await mkdirp(join(backupDirectory, "1800-12-04/full"));
    await writeFile(join(backupDirectory, "1800-12-04/full/bim"), "bar");

    await mkdirp(join(backupCompressDirectory, "1995-12-04/full"));
    await writeFile(
      join(backupCompressDirectory, "1995-12-04/full/bim"),
      "bar"
    );

    await mkdirp(join(backupCompressDirectory, "1800-12-04/full"));
    await writeFile(
      join(backupCompressDirectory, "1800-12-04/full/bim"),
      "bar"
    );

    await runClean(options);

    expect([await tree(backupDirectory), await tree(backupCompressDirectory)])
      .toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "dir": "1995-12-04",
            "files": Array [
              Object {
                "dir": "full",
                "files": Array [
                  "bim",
                ],
              },
            ],
          },
        ],
        Array [
          Object {
            "dir": "1995-12-04",
            "files": Array [
              Object {
                "dir": "full",
                "files": Array [
                  "bim",
                ],
              },
            ],
          },
        ],
      ]
    `);
  });

  it("runCompress", async () => {
    const options = getOptions();
    const { backupDirectory, backupCompressDirectory } = options;

    await mkdirp(join(backupDirectory, "1995-12-04/full"));
    await writeFile(join(backupDirectory, "1995-12-04/full/bim"), "bar");
    await mkdirp(join(backupDirectory, "1995-12-04/inc-01-12-00"));
    await writeFile(
      join(backupDirectory, "1995-12-04/inc-01-12-00/bim"),
      "baz"
    );

    await runCompress(options, getBackupName());

    expect([await tree(backupDirectory), await tree(backupCompressDirectory)])
      .toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "dir": "1995-12-04",
            "files": Array [
              Object {
                "dir": "full",
                "files": Array [
                  "bim",
                ],
              },
              Object {
                "dir": "inc-01-12-00",
                "files": Array [
                  "bim",
                ],
              },
            ],
          },
        ],
        Array [
          Object {
            "dir": "1995-12-04",
            "files": Array [
              "full.tar.gz",
              "inc-01-12-00.tar.gz",
            ],
          },
        ],
      ]
    `);
  });
});

type TreeFile = string | { dir: string; files: TreeFile[] };
const tree = async (dir: string): Promise<TreeFile[]> => {
  const files = await readdir(dir);
  return Promise.all(
    files.map(async (file) => {
      try {
        return {
          dir: file,
          files: await tree(join(dir, file)),
        };
      } catch (err) {
        return file;
      }
    })
  );
};
