import { stdout, createCliForTest } from "./utils";

describe("documentation", () => {
  const callCli = createCliForTest("./fixtures/send-ships.ts");

  test("should output help", async () => {
    expect(await callCli(["--help"])).toEqual(
      stdout(
        `Usage send-ships.js [options]

Send ships to the specified destination

Options:

--help                      output usage information
--destination <string>      the ships destination
--number-of-ships <number>  the number of ships to send
--armed                     whether the ships are equipped with weapons or not
`
      )
    );
  });
});
