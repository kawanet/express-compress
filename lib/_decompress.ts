// _decompress.ts

import {RequestHandler} from "express";
import {responseHandler} from "express-intercept";
import {Transform} from "stream";
import * as zlib from "zlib";

const transforms = {
    br: zlib.createBrotliDecompress,
    gzip: zlib.createGunzip,
    deflate: zlib.createInflate,
} as { [encoding: string]: () => Transform };

/**
 * Returns an RequestHandler to decompress the Express.js response stream.
 * It work for any `Content-Type`s if `contentType` parameter is not given.
 */

export function decompress(contentType?: RegExp): RequestHandler {
    return responseHandler()
        // compress only when OK
        .if(res => +res.statusCode === 200)

        // decompress only for types specified
        .if(res => !contentType || contentType.test(String(res.getHeader("content-type"))))

        // decompress only when compressed
        .if(res => !!(res.getHeader("content-encoding") || res.getHeader("transfer-encoding")))

        .interceptStream((upstream, req, res) => {

            // find uncompress transform
            const contentEncoding = match(res.getHeader("content-encoding"));
            const transferEncoding = match(res.getHeader("transfer-encoding"));
            const transform = transforms[contentEncoding] || transforms[transferEncoding];
            if (!transform) return;

            res.removeHeader("content-encoding");
            res.removeHeader("transfer-encoding");
            res.removeHeader("content-length");

            return upstream.pipe(transform());
        });
}

function match(str: string | any): string {
    if (/br/.test(str)) return "br";
    if (/gzip/.test(str)) return "gzip";
    if (/deflate/.test(str)) return "deflate";
}
