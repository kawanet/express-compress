// encoding.ts — equivalent of master's test/encoding.test.ts.
//
// Covers gzip / deflate / br paths. supertest 7 auto-decodes responses, so
// success of compression is asserted via the Content-Encoding header, while
// the body is compared against the already-decoded `res.text`.

import {requestHandler} from "express-intercept"
import {strict as assert} from "node:assert"
import {it} from "node:test"
import supertest from "supertest"
import {compress, decompress} from "../../lib/express-compress.ts"
import type {ExpressModule} from "./util.ts"

export const runEncodingTests = (express: ExpressModule): void => {
    testFormat(express, "gzip")
    testFormat(express, "deflate")
    testFormat(express, "br")
}

const testFormat = (express: ExpressModule, format: string): void => {
    const responseHeader = (key: string) => requestHandler().use((req: any, res: any) => res.type("html").send(req.headers[key] || "-"))

    const buildRouter = () => {
        const router = express.Router()
        // Force the incoming Accept-Encoding to the format under test.
        router.use(requestHandler().getRequest(req => req.headers["accept-encoding"] = format))
        router.use(requestHandler().getRequest(req => delete req.headers["te"]))
        router.use(compress())
        router.use(responseHeader("accept-encoding"))
        return router
    }

    it(`content-encoding: ${format} compression`, async () => {
        const app = express().use(buildRouter())
        const res = await supertest(app).get("/").expect(200).expect("content-encoding", format)
        // res.text is the auto-decoded text.
        assert.equal(res.text, format)
    })

    it(`content-encoding: ${format} decompression`, async () => {
        const app = express().use(decompress(), buildRouter())
        const res = await supertest(app).get("/").expect(200)
        assert.equal(res.headers["content-encoding"] || "uncompressed", "uncompressed")
        assert.equal(res.text, format)
    })
}
