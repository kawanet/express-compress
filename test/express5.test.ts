// express5.test.ts — verifies Express 5 behavior.
//
// Loads `npm:express@^5` via the `express5` alias and runs every per-topic
// test against v5. `lib/express-compress.ts` only touches the standard
// `http.ServerResponse` API, so no source changes are required for v5.

import {describe} from "node:test";
import express from "express5";

import {runBinaryTests} from "./lib/binary.ts";
import {runContentLengthTests} from "./lib/content-length.ts";
import {runEncodingTests} from "./lib/encoding.ts";
import {runSynopsisTests} from "./lib/synopsis.ts";
import {runTextTests} from "./lib/text.ts";

describe("express5: binary", () => runBinaryTests(express as any));
describe("express5: encoding", () => runEncodingTests(express as any));
describe("express5: text", () => runTextTests(express as any));
describe("express5: synopsis", () => runSynopsisTests(express as any));
describe("express5: content-length", () => runContentLengthTests(express as any));
