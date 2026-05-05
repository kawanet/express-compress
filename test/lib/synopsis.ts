// synopsis.ts — equivalent of master's test/synopsis.test.ts.
//
// Runs the README SYNOPSIS as-is and confirms a brotli-compressed raw
// response can be decoded with zlib.brotliDecompressSync.
//
// supertest cannot opt out of auto-decompression, so this case uses raw
// http.request via util.rawRequest instead.

import {strict as assert} from "node:assert";
import {it} from "node:test";
import * as zlib from "node:zlib";

import {compress, decompress} from "../../lib/express-compress.ts";
import {rawRequest} from "./util.ts";
import type {ExpressModule} from "./util.ts";

export const runSynopsisTests = (express: ExpressModule): void => {
    it("SYNOPSIS", async () => {
        const app = express();
        app.use(compress({contentType: /html/}));
        app.use(decompress({contentType: /html/}));
        app.use((req, res) => res.type("html").send("<html>your content</html>"));

        const {headers, body} = await rawRequest(app, "/", {"accept-encoding": "br"});
        assert.equal(headers["content-encoding"], "br");
        const decoded = zlib.brotliDecompressSync(body);
        assert.equal(String(decoded), "<html>your content</html>");
    });
};
