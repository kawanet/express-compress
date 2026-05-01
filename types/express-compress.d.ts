import type {RequestHandler} from "express";

declare interface CompressOptions {
    contentLength?: RegExp | { test: (str: string) => boolean };
    contentType?: RegExp | { test: (str: string) => boolean };
    statusCode?: RegExp | { test: (str: string) => boolean };
}

/**
 * Returns a RequestHandler that compresses the Express.js response stream.
 * By default it compresses only text-ish `Content-Type` values matching
 * `/^text|json|javascript|svg|xml|utf-8/i`.
 * It honors the `Accept-Encoding` request header and the `Content-Encoding`
 * response header.
 */
export declare const compress: (options?: CompressOptions) => RequestHandler;

/**
 * Returns a RequestHandler that decompresses the Express.js response stream.
 * It decompresses every `Content-Type` when the `contentType` option is not
 * specified.
 * It honors the `Accept-Encoding` request header and the `Content-Encoding`
 * response header.
 */
export declare const decompress: (options?: CompressOptions) => RequestHandler;
