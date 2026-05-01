// express-compress.ts

import {responseHandler} from "express-intercept";

import type * as types from "../types/express-compress.d.ts";

type CompressOptions = types.CompressOptions;

type Tester = { test: (str: string) => boolean };

// compress if Content-Type: is a text-like type per default
const textTypes = /^text|json|javascript|svg|xml|utf-8/i;

const contentEncoding = /(^|\W)(br|gzip|deflate)(\W|$)/;

// skip when Content-Length: 0 specified
const contentLengthNotZero: Tester = {test: length => length !== "0"};

// compress if statusCode is OK
const statusCodeOK = /^(200)$/;

/**
 * Returns an RequestHandler to compress the Express.js response stream.
 * It performs compression only for text-ish `Content-Type`s which includes `/^text|json|javascript|svg|xml|utf-8/i` per default.
 * It supports `Accept-Encoding` request header and `Content-Encoding` response header.
 */

export const compress: typeof types.compress = options => {
    let {contentLength, contentType, statusCode} = options || {} as CompressOptions;

    if (!contentLength) contentLength = contentLengthNotZero;
    if (!contentType) contentType = textTypes;
    if (!statusCode) statusCode = statusCodeOK;

    return responseHandler()
        .if(res => !statusCode || statusCode.test(String(res.statusCode)))
        .if(res => !contentLength || contentLength.test(String(res.getHeader("content-length"))))
        .if(res => !contentType || contentType.test(String(res.getHeader("content-type"))))
        .if(res => !contentEncoding.test(String(res.getHeader("content-encoding"))))
        .compressResponse();
}

/**
 * Returns an RequestHandler to decompress the Express.js response stream.
 * It performs decompression for any `Content-Type`s if `contentType` parameter is not specified.
 * It supports `Accept-Encoding` request header and `Content-Encoding` response header.
 */

export const decompress: typeof types.decompress = options => {
    let {contentLength, contentType, statusCode} = options || {} as CompressOptions;

    return responseHandler()
        .if(res => !statusCode || statusCode.test(String(res.statusCode)))
        .if(res => !contentLength || contentLength.test(String(res.getHeader("content-length"))))
        .if(res => !contentType || contentType.test(String(res.getHeader("content-type"))))
        .if(res => contentEncoding.test(String(res.getHeader("content-encoding"))))
        .decompressResponse();
}
