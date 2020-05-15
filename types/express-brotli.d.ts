import { RequestHandler } from "express";
declare type Tester = {
    test: (str: string) => boolean;
};
export interface CompressOptions {
    contentLength?: RegExp | Tester;
    contentType?: RegExp | Tester;
    statusCode?: RegExp | Tester;
}
/**
 * Returns an RequestHandler to compress the Express.js response stream.
 * It performs compression only for text-ish `Content-Type`s which includes `/^text|json|javascript|svg|xml|utf-8/i` per default.
 * It supports `Accept-Encoding` request header and `Content-Encoding` response header.
 */
export declare function compress(options?: CompressOptions): RequestHandler;
/**
 * Returns an RequestHandler to decompress the Express.js response stream.
 * It performs decompression for any `Content-Type`s if `contentType` parameter is not specified.
 * It supports `Accept-Encoding` request header and `Content-Encoding` response header.
 */
export declare function decompress(options?: CompressOptions): RequestHandler;
export {};
