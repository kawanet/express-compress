// express5.test.ts — Express 5 系の動作確認
//
// `npm:express@^5` を `express5` alias で読み込み、shared.ts のテストを
// すべて 5 系で走らせる。lib/express-compress.ts は `http.ServerResponse`
// の標準 API しか触らないので、ソースゼロ touch で 5 系でも通るはず。

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
