import { ErrorRequestHandler } from 'express';
import { createRequire } from 'node:module';

import { Logger } from '../services/index.js';

const require = createRequire(import.meta.url);
let Logs = require('../../lang/logs.json');

export function handleError(): ErrorRequestHandler {
    return async (error, req, res, _next) => {
        await Logger.error({
            message: Logs.error.apiRequest
                .replaceAll('{HTTP_METHOD}', req.method)
                .replaceAll('{URL}', req.url),
            obj: error,
        });

        res.status(500).json({ error: true, message: error.message });
    };
}
