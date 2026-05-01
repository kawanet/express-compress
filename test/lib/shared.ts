// shared.ts — Express 4/5 共通のテストロジック
//
// `express` モジュールを引数で受け取り、4 系・5 系の両方で同じ
// アサーションを走らせる。各 *.express{4,5}.test.ts から呼び出す。

import {strict as assert} from "node:assert";
import {it} from "node:test";
import * as http from "node:http";
import * as zlib from "node:zlib";
import {requestHandler} from "express-intercept";
import supertest from "supertest";

import {compress, decompress} from "../../lib/express-compress.ts";

// テストごとに使う Express の最低限の型（4/5 共通サブセット）
type ExpressFn = {
    (): any;
    Router(): any;
};

/**
 * binary.test.ts 相当
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
        // supertest が自動 decode するため、生の Content-Encoding は header 上にだけ残る
        assert.ok(res.headers["content-encoding"], "should have content-encoding");
        // 自動 decode 後は元の content と一致するはず
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
 * encoding.test.ts 相当：gzip/deflate/br の3経路をカバー
 *
 * supertest 7 はレスポンスを自動で decode するため、ここでは
 * Content-Encoding ヘッダのみで圧縮成功を確認し、本文は decode 済みの
 * res.text と比較する。
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
        // クライアントから来た accept-encoding を強制的に format に揃える
        router.use(requestHandler().getRequest(req => req.headers["accept-encoding"] = format));
        router.use(requestHandler().getRequest(req => delete req.headers["te"]));
        router.use(compress());
        router.use(responseHeader("accept-encoding"));
        return router;
    };

    it(`content-encoding: ${format} compression`, async () => {
        const app = express().use(buildRouter());
        const res = await supertest(app).get("/").expect(200).expect("content-encoding", format);
        // supertest が自動 decode するので res.text は元のテキスト
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
 * text.test.ts 相当
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
 * synopsis.test.ts 相当：README に載っている SYNOPSIS をそのまま走らせ、
 * br 圧縮された生レスポンスを zlib.brotliDecompressSync で復号できることを確認する。
 *
 * supertest は自動 decompress を回避できないため、ここだけ素の http.request を使う。
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
 * compress 適用後に Content-Length が圧縮後サイズに張り直される(≠元のサイズ)ことの確認。
 *
 * express-intercept の `_payload.ts` は圧縮後の buffer.length を Content-Length に
 * セットする実装。元の文字列長と異なる値が入ることで、圧縮処理が走ったことを保証する。
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
        // 圧縮後の長さは生の bytes 長と一致するはず
        assert.equal(Number(len), body.length, "Content-Length should match compressed body length");
        // かつ元の文字列長より短い（= 圧縮された）
        assert.ok(Number(len) < original.length, `expected compressed length < ${original.length}, got ${len}`);
    });
};

const toHEX = (buf: Buffer): string => Buffer.from(buf).toString("hex");

/**
 * 自動 decompress を回避して生バイトで取得するための簡易 http クライアント。
 * supertest は内部で zlib によって自動 decode してしまうので、Content-Encoding を
 * 検証する系のテストではこれを使う。
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
