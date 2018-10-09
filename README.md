# typescript-to-cli

> Transform your typescript module into a CLI

typescript-to-cli leverages the typescript type system to generate a CLI based on the exported function signature of your module.

- **Parses** the program arguments
- **Validates** if the arguments have the right type
- **Generates help** based on the documentation

:warning:

**This is an experimental project! A lot of features are missing and it probably contains some bugs.
If one of your use case is not supported, please create an issue or contact me on [twitter](https://twitter.com/guillaume_slls).**

:warning:

## Usage

Let's take the following module as an example.

**send-ships.ts**

```typescript
/**
 * Send ships to the specified destination
 *
 * @param destination the ships target
 * @param numberOfShips the number of ships to send
 * @param armed whether the ships are equipped with weapons or not
 */
export default function(
  destination: string,
  numberOfShips: number,
  armed: boolean
) {
  console.log(
    `You sent ${numberOfShips} ${armed ? "armed" : ""} ships to ${destination}.`
  );
}
```

### Generate the CLI

```console
$ npx typescript-to-cli ./send-ships.ts
send-ships.js CLI has been generated.
```

#### tsconfig.json resolution

If `typescript-to-cli` detects a `tsconfig.json` in the current folder, it will use it to generate the CLI. If you want to use a custom `tsconfig.json`, you can use the command line option `--project` (or just `-p`) that specifies the path of a directory containing a `tsconfig.json` file, or a path to a valid .json file containing the configurations.

```console
$ npx typescript-to-cli ./send-ships.ts --project ./path-to-config/tsconfig.json
send-ships.js CLI has been generated.
```

### Execute the CLI

```console
$ ./send-ships.js --destination Mars --number-of-ships 5 --armed
You sent 5 armed ships to Mars.
```

Or with the `=` symbol between arguments and values

```console
$ ./send-ships.js --destination=Europa --number-of-ships=2
You sent 2 ships to Europa.
```

### Examples

#### Non required option

```typescript
export default function(option: string | undefined) {}
```

or

```typescript
export default function(option?: string) {}
```

#### Restrict option with string literal types

```typescript
// cli.ts

export default function(primaryColor: "cyan" | "magenta" | "yellow") {}
```

```console
$ npx typescript-to-cli ./cli.ts
cli.js CLI has been generated.
$ ./cli.js --primary-color green
--primary-color does not accept the value "green". Allowed values: cyan, magenta, yellow
```

### Argument validation

#### Missing argument

```console
$ ./send-ships.js --number-of-ships 5 --armed
Missing argument --destination
```

#### Invalid argument type

```console
$ ./send-ships.js --destination Mars --number-of-ships X --armed
--number-of-ships should be a number
```

### Display help

```console
$ ./send-ships.js --help
Usage send-ships.js [options]

Send ships to the specified destination

Options:

--help                     output usage information
--destination <string>     the ships destination
--number-of-ship <number>  the number of ships to send
--armed                    whether the ships are equipped with weapons or not
```

## Generate the CLI from a js module and JSDoc type annotations

`typescript-to-cli` can also infer the parameters types from JSDoc annotations. However, your `tsconfig.json` should allow js files with `"allowJs": true` and an `outDir` to avoid overriding the input file. Let's take the same previous example but with JSDoc type annotations instead.

**send-ships.js**

```javascript
/**
 * Send ships to the specified destination
 *
 * @param {string} destination the ships target
 * @param {number} numberOfShips the number of ships to send
 * @param {boolean} armed whether the ships are equipped with weapons or not
 */
export default function(destination, numberOfShips, armed) {
  console.log(
    `You sent ${numberOfShips} ${armed ? "armed" : ""} ships to ${destination}.`
  );
}
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "allowJs": true,
    "outDir": "dist"
  }
}
```

```console
$ npx typescript-to-cli ./send-ships.js
./dist/send-ships.js CLI has been generated.
```


## Limitations

- Supports only boolean, number, string, string literals
- No argument shorcut
