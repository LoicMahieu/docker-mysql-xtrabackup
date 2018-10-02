
import typescript from "rollup-plugin-typescript";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";

export default {
  input: "./src/cli.ts",
  output: {
    file: "./bin/xtrabackup-runner",
    format: "cjs",
    name: "xtrabackupRunner",
  },
  plugins: [
    json(),
    resolve(),
    typescript(),
    {
      generateBundle: (outputOptions, bundle, isWrite) => {
        bundle["xtrabackup-runner"].code = "#!/usr/bin/env node\n\n" + bundle["xtrabackup-runner"].code;
      },
    },
    commonjs(),
  ],
}
