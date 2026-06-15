// express5.test.ts — verifies Express 5 behavior.
//
// Loads `npm:express@^5` via the `express5` alias and runs every per-topic
// test against v5. `lib/express-compress.ts` only touches the standard
// `http.ServerResponse` API, so no source changes are required for v5.

import express5 from "express5"
import {describe} from "node:test"
import {runBinaryTests} from "./lib/binary.ts"
import {runContentLengthTests} from "./lib/content-length.ts"
import {runEncodingTests} from "./lib/encoding.ts"
import {runSynopsisTests} from "./lib/synopsis.ts"
import {runTextTests} from "./lib/text.ts"
import type {ExpressModule} from "./lib/util.ts"

// Runtime tests cover both Express 4 and 5. Type-level dual coverage
// is intentionally out of scope, so this cast pins express5 to the
// Express 4 baseline that the shared runners type-check against.
const express = express5 as unknown as ExpressModule

describe("express5: binary", () => runBinaryTests(express))
describe("express5: encoding", () => runEncodingTests(express))
describe("express5: text", () => runTextTests(express))
describe("express5: synopsis", () => runSynopsisTests(express))
describe("express5: content-length", () => runContentLengthTests(express))
