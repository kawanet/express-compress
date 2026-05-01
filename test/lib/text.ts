// text.ts — equivalent of master's test/text.test.ts.

import {strict as assert} from "node:assert";
import {it} from "node:test";
import {requestHandler} from "express-intercept";
import supertest from "supertest";

import {compress, decompress} from "../../lib/express-compress.ts";
import type {ExpressFn} from "./util.ts";

export const runTextTests = (express: ExpressFn): void => {
    const content = "TEXT";

    const responseText = () => requestHandler().use((req: any, res: any) => res.type("text/plain").send(content));

    const buildRouter = () => {
        const router = express.Router();
        router.use(decompress({contentType: /^application/}));
        router.use(compress({contentType: /^text/}));
        router.use(responseText());
        return router;
    };

    it("text compression", async () => {
        const app = express().use(buildRouter());
        const res = await supertest(app).get("/").expect(200);
        assert.ok(res.headers["content-encoding"], "should have content-encoding");
        assert.equal(res.text, content);
    });

    it("text decompression", async () => {
        const app = express().use(decompress({contentType: /^text/}), buildRouter());
        const res = await supertest(app).get("/").expect(200);
        assert.equal(res.headers["content-encoding"] || "uncompressed", "uncompressed");
        assert.equal(res.text, content);
    });
};
