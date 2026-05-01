// util.ts — shared helpers used by every per-topic test module.
//
// Lives outside any single topic so each test/lib/<topic>.ts can stay
// focused on its own assertions while pulling common types and the raw
// http client from one place.

import * as http from "node:http";

// Minimal subset of the Express factory shared by v4 and v5.
export type ExpressFn = {
    (): any;
    Router(): any;
};

// Hex helper kept here so binary-style assertions can be written once.
export const toHEX = (buf: Buffer): string => Buffer.from(buf).toString("hex");

/**
 * Minimal http client that bypasses supertest's automatic decompression so
 * tests can inspect the raw bytes. supertest decodes via zlib internally,
 * which would mask the Content-Encoding behavior we want to verify.
 */
export const rawRequest = (app: any, path: string, headers: Record<string, string>): Promise<{
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
