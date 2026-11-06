# Working on this repository

## Finding your way in the code

Ask before you grep: `yarn variance ask uses --name <name>` lists who imports a
name, `ask symbol --name <name>` prints what it is and where it is declared, and
`ask search --query <words>` finds a name by what it does. The
`variance-authority` skill has the rest.

## Running the tests an edit needs

`VARIANCE_AUTHORITY_SINCE= yarn jest` runs the test files a recorded run shows
reached your edit. `build`, `init` and `cli` specs drive the built CLI from
another process, so no record reaches them: a selected run says nothing about
those commands. Run `yarn test` before you call a change done.
