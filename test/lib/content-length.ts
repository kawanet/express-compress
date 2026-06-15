// content-length.ts — new topic added on top of master's four files.
//
// Confirms Content-Length is rewritten to the compressed body length
// (≠ the original size) after compress is applied.
//
// express-intercept's `_payload.ts` sets Content-Length to the compressed
// buffer length; a value different from the original string length proves
// the compression pipeline ran.

import {strict as assert} from "node:assert"
import {it} from "node:test"

import {compress} from "../../lib/express-compress.ts"
import type {ExpressModule} from "./util.ts"
import {rawRequest} from "./util.ts"

export const runContentLengthTests = (express: ExpressModule): void => {
    it("Content-Length is rewritten to compressed body length", async () => {
        const original = "hello content-length test repeated text repeated text".repeat(10)
        const app = express()
        app.use(compress())
        app.use((req, res) => res.type("text/plain").send(original))

        const {headers, body} = await rawRequest(app, "/", {"accept-encoding": "gzip"})
        assert.equal(headers["content-encoding"], "gzip")
        const len = headers["content-length"]
        // Compressed length must equal the raw byte length of the wire body.
        assert.equal(Number(len), body.length, "Content-Length should match compressed body length")
        // …and must be shorter than the original (proving compression ran).
        assert.ok(Number(len) < original.length, `expected compressed length < ${original.length}, got ${len}`)
    })
}
