// binary.ts — equivalent of master's test/binary.test.ts.
//
// Exposes runBinaryTests(express) so each entry point (express4 / express5)
// can run the same suite against its aliased Express version.

import {requestHandler} from "express-intercept"
import {strict as assert} from "node:assert"
import {it} from "node:test"
import supertest from "supertest"
import {compress, decompress} from "../../lib/express-compress.ts"
import type {ExpressModule} from "./util.ts"
import {toHEX} from "./util.ts"

export const runBinaryTests = (express: ExpressModule): void => {
    const content = Buffer.from("BINARY")

    const responseBinary = () => requestHandler().use((req: any, res: any) => res.type("application/octet-stream").send(content))

    const buildRouter = () => {
        const router = express.Router()
        router.use(decompress({contentType: /^application/}))
        router.use(compress({contentType: /^text/}))
        router.use(responseBinary())
        return router
    }

    it("binary compression skipped", async () => {
        const app = express().use(buildRouter())
        const res = await supertest(app).get("/").expect(200)
        assert.equal(res.headers["content-encoding"] || "uncompressed", "uncompressed")
        assert.equal(toHEX(res.body), toHEX(content))
    })

    it("binary compression", async () => {
        const app = express().use(compress({contentType: /^application/}), buildRouter())
        const res = await supertest(app).get("/").expect(200)
        // supertest auto-decodes the body, so the raw Content-Encoding only survives on the header.
        assert.ok(res.headers["content-encoding"], "should have content-encoding")
        // After auto-decode, the body should match the original content.
        assert.equal(toHEX(res.body), toHEX(content))
    })

    it("binary decompression", async () => {
        const app = express().use(decompress(), buildRouter())
        const res = await supertest(app).get("/").expect(200)
        assert.equal(res.headers["content-encoding"] || "uncompressed", "uncompressed")
        assert.equal(toHEX(res.body), toHEX(content))
    })
}
