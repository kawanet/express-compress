// util.ts — shared helpers used by every per-topic test module.
//
// Lives outside any single topic so each test/lib/<topic>.ts can stay
// focused on its own assertions while pulling common types and the raw
// http client from one place.

import * as http from "node:http"

// The full Express module/namespace value: call signature + namespace
// methods (`.Router`, `.static`, `.json`, ...) the runners reach for.
// Express ships as a CommonJS `export = e` namespace, so
// `typeof import("express")` resolves to the value of `import express
// from "express"` directly (no `.default`).
export type ExpressModule = typeof import("express")

// Hex helper kept here so binary-style assertions can be written once.
export const toHEX = (buf: Buffer): string => Buffer.from(buf).toString("hex")

/**
 * Minimal http client that bypasses supertest's automatic decompression so
 * tests can inspect the raw bytes. supertest decodes via zlib internally,
 * which would mask the Content-Encoding behavior we want to verify.
 */
export const rawRequest = (app: any, path: string, headers: Record<string, string>): Promise<{
    headers: http.IncomingHttpHeaders
    body: Buffer
}> => new Promise((resolve, reject) => {
    const server = http.createServer(app).listen(0, () => {
        const port = (server.address() as any).port
        const req = http.request({port, path, headers}, res => {
            const chunks: Buffer[] = []
            res.on("data", (chunk: Buffer) => chunks.push(chunk))
            res.on("end", () => {
                server.close()
                resolve({headers: res.headers, body: Buffer.concat(chunks)})
            })
            res.on("error", err => {
                server.close()
                reject(err)
            })
        })
        req.on("error", err => {
            server.close()
            reject(err)
        })
        req.end()
    })
})
