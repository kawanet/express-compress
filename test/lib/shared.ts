// shared.ts — shared test logic for Express 4 and 5.
//
// Receives the `express` module as an argument and runs the same set of
// assertions on both. Invoked by each *.express{4,5}.test.ts entry.

import {strict as assert} from "node:assert";
import {it} from "node:test";
import * as http from "node:http";
import * as zlib from "node:zlib";
import {requestHandler} from "express-intercept";
import supertest from "supertest";

import {compress, decompress} from "../../lib/express-compress.ts";

// Minimal subset of the Express factory shared by v4 and v5.
type ExpressFn = {
    (): any;
    Router(): any;
};

/**
 * Equivalent of binary.test.ts.
 */
export const runBinaryTests = (express: ExpressFn): void => {
    const content = Buffer.from("BINARY");

    const responseBinary = () => requestHandler().use((req: any, res: any) => res.type("application/octet-stream").send(content));

    const buildRouter = () => {
        const router = express.Router();
        router.use(decompress({contentType: /^application/}));
        router.use(compress({contentType: /^text/}));
        router.use(responseBinary());
        return router;
    };

    it("binary compression skipped", async () => {
        const app = express().use(buildRouter());
        const res = await supertest(app).get("/").expect(200);
        assert.equal(res.headers["content-encoding"] || "uncompressed", "uncompressed");
        assert.equal(toHEX(res.body), toHEX(content));
    });

    it("binary compression", async () => {
        const app = express().use(compress({contentType: /^application/}), buildRouter());
        const res = await supertest(app).get("/").expect(200);
        // supertest auto-decodes the body, so the raw Content-Encoding only survives on the header.
        assert.ok(res.headers["content-encoding"], "should have content-encoding");
        // After auto-decode, the body should match the original content.
        assert.equal(toHEX(res.body), toHEX(content));
    });

    it("binary decompression", async () => {
        const app = express().use(decompress(), buildRouter());
        const res = await supertest(app).get("/").expect(200);
        assert.equal(res.headers["content-encoding"] || "uncompressed", "uncompressed");
        assert.equal(toHEX(res.body), toHEX(content));
    });
};

/**
 * Equivalent of encoding.test.ts: covers gzip / deflate / br paths.
 *
 * supertest 7 auto-decodes responses, so success of compression is asserted
 * via the Content-Encoding header, while the body is compared against the
 * already-decoded `res.text`.
 */
export const runEncodingTests = (express: ExpressFn): void => {
    testFormat(express, "gzip");
    testFormat(express, "deflate");
    testFormat(express, "br");
};

const testFormat = (express: ExpressFn, format: string): void => {
    const responseHeader = (key: string) => requestHandler().use((req: any, res: any) => res.type("html").send(req.headers[key] || "-"));

    const buildRouter = () => {
        const router = express.Router();
        // Force the incoming Accept-Encoding to the format under test.
        router.use(requestHandler().getRequest(req => req.headers["accept-encoding"] = format));
        router.use(requestHandler().getRequest(req => delete req.headers["te"]));
        router.use(compress());
        router.use(responseHeader("accept-encoding"));
        return router;
    };

    it(`content-encoding: ${format} compression`, async () => {
        const app = express().use(buildRouter());
        const res = await supertest(app).get("/").expect(200).expect("content-encoding", format);
        // res.text is the auto-decoded text.
        assert.equal(res.text, format);
    });

    it(`content-encoding: ${format} decompression`, async () => {
        const app = express().use(decompress(), buildRouter());
        const res = await supertest(app).get("/").expect(200);
        assert.equal(res.headers["content-encoding"] || "uncompressed", "uncompressed");
        assert.equal(res.text, format);
    });
};

/**
 * Equivalent of text.test.ts.
 */
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

/**
 * Equivalent of synopsis.test.ts: runs the README SYNOPSIS as-is and confirms
 * a brotli-compressed raw response can be decoded with zlib.brotliDecompressSync.
 *
 * supertest cannot opt out of auto-decompression, so this case uses raw
 * http.request instead.
 */
export const runSynopsisTests = (express: ExpressFn): void => {
    it("SYNOPSIS", async () => {
        const app = express();
        app.use(compress({contentType: /html/}));
        app.use(decompress({contentType: /html/}));
        app.use((req: any, res: any) => res.type("html").send("<html>your content</html>"));

        const {headers, body} = await rawRequest(app, "/", {"accept-encoding": "br"});
        assert.equal(headers["content-encoding"], "br");
        const decoded = zlib.brotliDecompressSync(body);
        assert.equal(String(decoded), "<html>your content</html>");
    });
};

/**
 * Confirms Content-Length is rewritten to the compressed body length
 * (≠ the original size) after compress is applied.
 *
 * express-intercept's `_payload.ts` sets Content-Length to the compressed
 * buffer length; a value different from the original string length proves
 * the compression pipeline ran.
 */
export const runContentLengthTests = (express: ExpressFn): void => {
    it("Content-Length is rewritten to compressed body length", async () => {
        const original = "hello content-length test repeated text repeated text".repeat(10);
        const app = express();
        app.use(compress());
        app.use((req: any, res: any) => res.type("text/plain").send(original));

        const {headers, body} = await rawRequest(app, "/", {"accept-encoding": "gzip"});
        assert.equal(headers["content-encoding"], "gzip");
        const len = headers["content-length"];
        // Compressed length must equal the raw byte length of the wire body.
        assert.equal(Number(len), body.length, "Content-Length should match compressed body length");
        // …and must be shorter than the original (proving compression ran).
        assert.ok(Number(len) < original.length, `expected compressed length < ${original.length}, got ${len}`);
    });
};

const toHEX = (buf: Buffer): string => Buffer.from(buf).toString("hex");

/**
 * Minimal http client that bypasses supertest's automatic decompression so
 * tests can inspect the raw bytes. supertest decodes via zlib internally,
 * which would mask the Content-Encoding behavior we want to verify.
 */
const rawRequest = (app: any, path: string, headers: Record<string, string>): Promise<{
    headers: http.IncomingHttpHeaders;
    body: Buffer;
}> => new Promise((resolve, reject) => {
    const server = http.createServer(app).listen(0, () => {
        const port = (server.address() as any).port;
        const req = http.request({port, path, headers}, res => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => {
                server.close();
                resolve({headers: res.headers, body: Buffer.concat(chunks)});
            });
            res.on("error", err => {
                server.close();
                reject(err);
            });
        });
        req.on("error", err => {
            server.close();
            reject(err);
        });
        req.end();
    });
});
