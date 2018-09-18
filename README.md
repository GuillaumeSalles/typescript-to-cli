# typescript-to-cli

> Transform your typescript module into a CLI

typescript-to-cli leverages the typescript type system to generate a CLI based on the exported function signature of your module.

- **Parses** the program arguments
- **Validates** if the arguments have the right type
- **Generates help** based on the documentation

:warning:
This is an experimental project! A lot of features are missing and it probably contains some bugs.
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

### Create the CLI

```console
$ npx typescript-to-cli ./send-ships.ts
send-ships.js CLI has been generated.
```

### Call the created CLI

```console
$ ./send-ships.js --destination Mars --number-of-ships 5 --armed
You sent 5 armed ships to Mars.
```

Or with the `=` symbol between arguments and values

```console
$ ./send-ships.js --destination=Europa --number-of-ships=2
You sent 2 ships to Europa.
```

### Argument validation

Missing argument

```console
$ ./send-ships.js --number-of-ships 5 --armed
Missing argument --destination
```

Invalid argument type

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

## Limitations

- Supports only boolean, number and string
- All arguments are required
- Don't accept a custom `tsconfig.json`
- No argument shorcut
