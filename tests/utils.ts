import * as child_process from "child_process";
import { replaceExtension } from "../src/replaceExtension";

type ProcessOutput = {
  stdout: string;
  stderr: string;
};

export function stdout(str: string): ProcessOutput {
  return {
    stdout: str,
    stderr: ""
  };
}

export function stderr(str: string): ProcessOutput {
  return {
    stdout: "",
    stderr: str
  };
}

export function fork(script: string, argv: string[]): Promise<ProcessOutput> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const child = child_process.fork(script, argv, {
      silent: true
    });
    child.on("exit", (code, signal) => {
      resolve({
        stdout,
        stderr
      });
    });
    child.stdout.on("data", x => (stdout += x.toString()));
    child.stderr.on("data", x => (stderr += x.toString()));
  });
}

function spawn(script: string, argv: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = child_process.spawn(script, argv, {
      // silent: true
    });
    child.stdout.on("data", x => resolve(x.toString()));
    child.stderr.on("data", x => {
      reject(x.toString());
    });
  });
}

export function createCliForTest(path: string) {
  beforeAll(async () => {
    const result = await fork("./bin/index.js", [path, "--project", __dirname]);
    if (result.stderr !== "") {
      throw new Error("Fixture generation fail. " + result.stderr);
    }
  }, 10000);

  return (argv: string[]) => fork(replaceExtension(path, ".js"), argv);
}
