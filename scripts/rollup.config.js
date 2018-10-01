
import typescript from "rollup-plugin-typescript2";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";

export default {
  input: "./src/cli.ts",
  output: {
    file: "./lib/cli.js",
    format: "cjs",
    name: "xtrabackupRunner"
  },
  plugins: [
    json(),
    resolve(),
    typescript(),
    commonjs()
  ]
}
