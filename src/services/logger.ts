import { DiscordAPIError } from 'discord.js';
import { Response } from 'node-fetch';
import pino from 'pino';

import { config } from '../config/config.js';
import { BotErrorDbUtils } from '../utils/database/bot-error-db-utils.js';

type LoggerOptions = {
    message: string;
    obj?: any;
    guildId?: string;
    userId?: string;
    newsId?: number;
};

let logger = pino(
    {
        formatters: {
            level: label => {
                return { level: label };
            },
        },
    },
    config.logging.pretty
        ? pino.transport({
              target: 'pino-pretty',
              options: {
                  colorize: true,
                  ignore: 'pid,hostname',
                  translateTime: 'yyyy-mm-dd HH:MM:ss.l',
              },
          })
        : undefined
);

export class Logger {
    private static shardId: number;

    public static info(options: LoggerOptions): void {
        const { message, obj } = options;
        obj ? logger.info(obj, message) : logger.info(message);
    }

    public static warn(options: LoggerOptions): void {
        const { message, obj } = options;
        obj ? logger.warn(obj, message) : logger.warn(message);
    }

    public static async error(options: LoggerOptions): Promise<void> {
        const { message, obj, guildId, userId, newsId } = options;
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        const messageError = obj ? message + obj.message : message;
        await BotErrorDbUtils.createError({
            message: message ? message : obj ? messageError : 'No message or object provided',
            guild_id: guildId,
            user_id: userId,
            news_id: newsId,
        });
        // Log just a message if no error object
        if (!obj) {
            logger.error(message);
            return;
        }

        // Otherwise log details about the error
        if (typeof obj === 'string') {
            logger
                .child({
                    message: obj,
                })
                .error(message);
        } else if (obj instanceof Response) {
            let resText: string;
            try {
                resText = await obj.text();
            } catch {
                // Ignore
            }
            const child = {
                path: obj.url,
                statusCode: obj.status,
                statusName: obj.statusText,
                headers: obj.headers.raw(),
                body: resText,
            };
            logger.child(child).error(message);
        } else if (obj instanceof DiscordAPIError) {
            const child = {
                message: obj.message,
                code: obj.code,
                statusCode: obj.status,
                method: obj.method,
                url: obj.url,
                stack: obj.stack,
            };
            logger.child(child).error(message);
        } else {
            logger.error(obj, message);
        }
    }

    public static setShardId(shardId: number): void {
        if (this.shardId !== shardId) {
            this.shardId = shardId;
            logger = logger.child({ shardId });
        }
    }
}
