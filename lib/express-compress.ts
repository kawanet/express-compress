// express-compress.ts

import type * as types from "express-compress"
import {responseHandler} from "express-intercept"

type CompressOptions = types.CompressOptions

type Tester = {test: (str: string) => boolean}

// Compress only text-ish Content-Type values by default.
const textTypes = /^text|json|javascript|svg|xml|utf-8/i

const contentEncoding = /(^|\W)(br|gzip|deflate)(\W|$)/

// Skip when Content-Length: 0 is set.
const contentLengthNotZero: Tester = {test: length => length !== "0"}

// Compress only when the status code is OK.
const statusCodeOK = /^(200)$/

/**
 * Returns a RequestHandler that compresses the Express.js response stream.
 * By default it compresses only text-ish `Content-Type` values matching
 * `/^text|json|javascript|svg|xml|utf-8/i`.
 * It honors the `Accept-Encoding` request header and the `Content-Encoding`
 * response header.
 */

export const compress: typeof types.compress = options => {
    let {contentLength, contentType, statusCode} = options || {} as CompressOptions

    if (!contentLength) contentLength = contentLengthNotZero
    if (!contentType) contentType = textTypes
    if (!statusCode) statusCode = statusCodeOK

    return responseHandler()
        .if(res => !statusCode || statusCode.test(String(res.statusCode)))
        .if(res => !contentLength || contentLength.test(String(res.getHeader("content-length"))))
        .if(res => !contentType || contentType.test(String(res.getHeader("content-type"))))
        .if(res => !contentEncoding.test(String(res.getHeader("content-encoding"))))
        .compressResponse()
}

/**
 * Returns a RequestHandler that decompresses the Express.js response stream.
 * It decompresses every `Content-Type` when the `contentType` option is not
 * specified.
 * It honors the `Accept-Encoding` request header and the `Content-Encoding`
 * response header.
 */

export const decompress: typeof types.decompress = options => {
    let {contentLength, contentType, statusCode} = options || {} as CompressOptions

    return responseHandler()
        .if(res => !statusCode || statusCode.test(String(res.statusCode)))
        .if(res => !contentLength || contentLength.test(String(res.getHeader("content-length"))))
        .if(res => !contentType || contentType.test(String(res.getHeader("content-type"))))
        .if(res => contentEncoding.test(String(res.getHeader("content-encoding"))))
        .decompressResponse()
}
