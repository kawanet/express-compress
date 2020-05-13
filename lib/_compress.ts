// _compress.ts

import {RequestHandler} from "express";
import {responseHandler} from "express-intercept";
import {Transform} from "stream";
import * as zlib from "zlib";

const transforms = {
    br: zlib.createBrotliCompress,
    gzip: zlib.createGzip,
    deflate: zlib.createDeflate,
} as { [encoding: string]: () => Transform };

const textTypes = /^text|json|javascript|svg|xml|utf-8/i;

/**
 * Returns an RequestHandler to compress the Express.js response stream.
 * It work only for text-ish `Content-Type`s which includes `/^text|json|javascript|svg|xml|utf-8/i` per default.
 */

export function compress(contentType?: RegExp): RequestHandler {
    if (!contentType) contentType = textTypes;

    return responseHandler()

        // Accept-Encoding: or TE: required
        .for(req => !!(req.header("accept-encoding") || req.header("te")))

        // compress only when OK
        .if(res => +res.statusCode === 200)

        // comppress only for types specified
        .if(res => !contentType || contentType.test(String(res.getHeader("content-type"))))

        // ignore when already compressed
        .if(res => !(res.getHeader("content-encoding") || res.getHeader("transfer-encoding")))

        .interceptStream((upstream, req, res) => {

            // find compress transform
            const acceptEncoding = match(req.header("accept-encoding"));
            const transferEncoding = match(req.header("te"));
            const transform = transforms[acceptEncoding] || transforms[transferEncoding];
            if (!transform) return;

            if (transforms[acceptEncoding]) {
                res.setHeader("content-encoding", acceptEncoding);
                res.removeHeader("transfer-encoding");
            } else if (transforms[transferEncoding]) {
                res.removeHeader("content-encoding");
                res.setHeader("transfer-encoding", transferEncoding);
            }

            res.removeHeader("content-length");

            return upstream.pipe(transform());
        });
}

function match(str: string | any): string {
    if (/br/.test(str)) return "br";
    if (/gzip/.test(str)) return "gzip";
    if (/deflate/.test(str)) return "deflate";
}