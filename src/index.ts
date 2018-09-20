#!/usr/bin/env node

import * as ts from "typescript";

import { emitAndGetCliSignature } from "./emitAndGetCliSignature";

const defaultOptions = {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS
};

function getConfigSearchPath(argv: string[]) {
  if (argv[3] === "--project" || argv[3] === "-p") {
    if (argv[4] == null) {
      throw new Error(`Missing value for argument ${argv[3]}`);
    }

    return argv[4];
  }

  return (<any>ts).normalizePath(ts.sys.getCurrentDirectory());
}

function getConfig(argv: string[]) {
  const configFileName = ts.findConfigFile(
    getConfigSearchPath(argv),
    ts.sys.fileExists
  );

  if (configFileName === undefined) {
    console.log("tsconfig.json not found. Fallback to default config.");
    return defaultOptions;
  }

  const host: ts.ParseConfigFileHost = <any>ts.sys;
  const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
    configFileName,
    {},
    host
  );

  if (parsedCommandLine === undefined) {
    return defaultOptions;
  }

  return parsedCommandLine.options;
}

async function generateCli(argv: string[]): Promise<void> {
  const fileName = argv[2];

  if (fileName === undefined) {
    throw new Error("Typescript file path is missing");
  }

  const options = getConfig(argv);

  let program = ts.createProgram([fileName], options);

  await emitAndGetCliSignature(fileName, program);
}

if (process.argv.length < 2) {
  process.stderr.write("Typescript file path is missing");
  process.exit(1);
}

try {
  generateCli(process.argv).catch(err => {
    process.stderr.write(err.message);
    process.exit(1);
  });
} catch (err) {
  process.stderr.write(err.message);
  process.exit(1);
}
