# typescript-to-cli

> Transform your typescript module into a CLI

typescript-to-cli checks the default export of your typescript module and create a CLI from it.

- **Parses** the program arguments
- **Validates** if the arguments have the right type
- **Generates help** based on the documentation

:warning:
This is an experimental project! A lot of features are missing and it probably contains some bugs.
:warning:

## Usage

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

```console
$ npx typescript-to-cli ./sendShip.ts

$ ./sendShip.js --destination Mars --number-of-ships 5 --armed
You sent 5 armed ships to Mars.

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
