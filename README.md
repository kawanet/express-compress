# express-compress

Express middlewares to compress/decompress response with encoding: brotli, gzip and deflate

[![Node.js CI](https://github.com/kawanet/express-compress/workflows/Node.js%20CI/badge.svg?branch=master)](https://github.com/kawanet/express-compress/actions/)
[![npm version](https://badge.fury.io/js/express-compress.svg)](https://www.npmjs.com/package/express-compress)

Works with Express 4 and 5.

## SYNOPSIS

```js
import express from "express";
import {compress, decompress} from "express-compress";

const app = express();

app.use(compress({contentType: /html/}));

app.use(decompress({contentType: /html/}));

app.use((req, res) => res.type("html").send("<html>your content</html>"));
```

## METHODS

See TypeScript declaration
[express-compress.d.ts](https://github.com/kawanet/express-compress/blob/master/types/express-compress.d.ts)
for more detail.

## SEE ALSO

- https://github.com/kawanet/express-compress
- https://github.com/kawanet/express-intercept

## LICENSE

The MIT License (MIT)

Copyright (c) 2020-2026 Yusuke Kawasaki

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
