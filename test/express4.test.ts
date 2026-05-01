// express4.test.ts — verifies Express 4 behavior.
//
// Loads `npm:express@^4` via the `express4` alias and runs every shared
// test against v4.

import {describe} from "node:test";
import express from "express4";

import {
    runBinaryTests,
    runContentLengthTests,
    runEncodingTests,
    runSynopsisTests,
    runTextTests,
} from "./lib/shared.ts";

describe("express4: binary", () => runBinaryTests(express as any));
describe("express4: encoding", () => runEncodingTests(express as any));
describe("express4: text", () => runTextTests(express as any));
describe("express4: synopsis", () => runSynopsisTests(express as any));
describe("express4: content-length", () => runContentLengthTests(express as any));
