// express4.test.ts — verifies Express 4 behavior.
//
// Loads `npm:express@^4` via the `express4` alias and runs every per-topic
// test against v4.

import {describe} from "node:test";
import express from "express4";

import {runBinaryTests} from "./lib/binary.ts";
import {runContentLengthTests} from "./lib/content-length.ts";
import {runEncodingTests} from "./lib/encoding.ts";
import {runSynopsisTests} from "./lib/synopsis.ts";
import {runTextTests} from "./lib/text.ts";

describe("express4: binary", () => runBinaryTests(express as any));
describe("express4: encoding", () => runEncodingTests(express as any));
describe("express4: text", () => runTextTests(express as any));
describe("express4: synopsis", () => runSynopsisTests(express as any));
describe("express4: content-length", () => runContentLengthTests(express as any));
