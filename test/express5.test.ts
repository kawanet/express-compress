// express5.test.ts — verifies Express 5 behavior.
//
// Loads `npm:express@^5` via the `express5` alias and runs every shared
// test against v5. `lib/express-compress.ts` only touches the standard
// `http.ServerResponse` API, so no source changes are required for v5.

import {describe} from "node:test";
import express from "express5";

import {
    runBinaryTests,
    runContentLengthTests,
    runEncodingTests,
    runSynopsisTests,
    runTextTests,
} from "./lib/shared.ts";

describe("express5: binary", () => runBinaryTests(express as any));
describe("express5: encoding", () => runEncodingTests(express as any));
describe("express5: text", () => runTextTests(express as any));
describe("express5: synopsis", () => runSynopsisTests(express as any));
describe("express5: content-length", () => runContentLengthTests(express as any));
