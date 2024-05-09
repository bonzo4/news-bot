import { ActivityType, Client, Presence, ShardingManager } from 'discord.js';
import { Request, Response, Router } from 'express';
import router from 'express-promise-router';
import { createRequire } from 'node:module';

import { Controller } from './index.js';
import { config } from '../config/config.js';
import { mapClass } from '../middleware/index.js';
import {
    GetShardsResponse,
    SetShardPresencesRequest,
    ShardInfo,
    ShardStats,
} from '../models/cluster-api/index.js';
import { Logger } from '../services/index.js';

const require = createRequire(import.meta.url);
let Logs = require('../../lang/logs.json');

export class ShardsController implements Controller {
    public path = '/shards';
    public router: Router = router();
    public authToken: string = config.api.secret;

    constructor(private shardManager: ShardingManager) {}

    public register(): void {
        this.router.get('/', (req, res) => this.getShards(req, res));
        this.router.put('/presence', mapClass(SetShardPresencesRequest), (req, res) =>
            this.setShardPresences(req, res)
        );
    }

    private async getShards(req: Request, res: Response): Promise<void> {
        let shardDatas = await Promise.all(
            this.shardManager.shards.map(async shard => {
                let shardInfo: ShardInfo = {
                    id: shard.id,
                    ready: shard.ready,
                    error: false,
                };

                try {
                    let uptime = (await shard.fetchClientValue('uptime')) as number;
                    shardInfo.uptimeSecs = Math.floor(uptime / 1000);
                } catch (error) {
                    await Logger.error({
                        message: Logs.error.managerShardInfo,
                        obj: error,
                    });
                    shardInfo.error = true;
                }

                return shardInfo;
            })
        );

        let stats: ShardStats = {
            shardCount: this.shardManager.shards.size,
            uptimeSecs: Math.floor(process.uptime()),
        };

        let resBody: GetShardsResponse = {
            shards: shardDatas,
            stats,
        };
        res.status(200).json(resBody);
    }

    private async setShardPresences(req: Request, res: Response): Promise<void> {
        let reqBody: SetShardPresencesRequest = res.locals.input;

        await this.shardManager.broadcastEval<Presence, SetShardPresenceContext>(
            (client: Client, context) => {
                return client.user.setPresence({
                    activities: [
                        {
                            type: context.type,
                            name: context.name,
                            url: context.url,
                        },
                    ],
                });
            },
            { context: { type: ActivityType[reqBody.type], name: reqBody.name, url: reqBody.url } }
        );

        res.sendStatus(200);
    }
}

export type SetShardPresenceContext = {
    type: ActivityType;
    name: string;
    url: string;
};
