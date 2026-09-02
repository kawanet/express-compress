import type * as declared from "express-compress"
import {strict as assert} from "node:assert"
import {createRequire} from "node:module"
import {test} from "node:test"
import * as m from "../lib/express-compress.ts"

const require = createRequire(import.meta.url)

// tsc fails here when a name declared in the published .d.ts is missing
// from the runtime entry -- the surface check derives from the declarations.
const runtime: typeof declared = m
void runtime

test("import entry (.mjs)", () => {
    assert.equal(typeof m.compress, "function")
    assert.equal(typeof m.decompress, "function")
})

test("require entry (.cjs)", () => {
    const m = require("express-compress")
    assert.equal(typeof m.compress, "function")
    assert.equal(typeof m.decompress, "function")
})
