#!/usr/bin/env node

import * as fs from "fs";
import { promisify } from "util";
import * as ts from "typescript";

import { emitAndGetCliSignature } from "./emitAndGetCliSignature";
import { replaceExtension } from "./replaceExtension";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const chmod = promisify(fs.chmod);

const wrapperSourceFile = `${__dirname}/wrapper.js`;

async function generateCli(
  fileName: string,
  options: ts.CompilerOptions
): Promise<void> {
  let program = ts.createProgram([fileName], options);

  const signature = emitAndGetCliSignature(fileName, program);

  const outputFile = replaceExtension(fileName, ".js");
  const outputJs = await readFile(outputFile, "utf-8");
  const cliEntryPoint = await readFile(wrapperSourceFile, "utf-8");

  await writeFile(
    outputFile,
    `#!/usr/bin/env node
${outputJs}
${cliEntryPoint}
exports.default.apply(null, TYPESCRIPT_TO_CLI_PREPARE_PARAMS(${JSON.stringify(
      signature
    )}, process.argv.slice(2)));
`
  );
  await chmod(outputFile, "755");

  process.stdout.write(`Cli generated : ${outputFile}`);
}

if (process.argv.length < 2) {
  process.stderr.write("Typescript file path is missing");
  process.exit(1);
}

try {
  generateCli(process.argv[2], {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS
  }).catch(err => {
    process.stderr.write(err.message);
    process.exit(1);
  });
} catch (err) {
  process.stderr.write(err.message);
  process.exit(1);
}
