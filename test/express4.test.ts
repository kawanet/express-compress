// express4.test.ts — Express 4 系の動作確認
//
// `npm:express@^4` を `express4` alias で読み込み、shared.ts のテストを
// すべて 4 系で走らせる。

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
