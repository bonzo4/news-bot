import { Shard, ShardingManager } from 'discord.js';
import { createRequire } from 'node:module';

import { config } from '../config/config.js';
import { debug } from '../config/debug.js';
import { JobService, Logger } from '../services/index.js';
import { startNewsChannel } from '../webhooks/news.js';

const require = createRequire(import.meta.url);
let Logs = require('../../lang/logs.json');

export class Manager {
    constructor(private shardManager: ShardingManager, private jobService: JobService) {}

    public async start(): Promise<void> {
        this.registerListeners();

        let shardList = this.shardManager.shardList as number[];

        try {
            Logger.info({
                message: Logs.info.managerSpawningShards
                    .replaceAll('{SHARD_COUNT}', shardList.length.toLocaleString())
                    .replaceAll('{SHARD_LIST}', shardList.join(', ')),
            });
            await this.shardManager.spawn({
                amount: this.shardManager.totalShards,
                delay: config.sharding.spawnDelay * 1000,
                timeout: config.sharding.spawnTimeout * 1000,
            });
            Logger.info({
                message: Logs.info.managerAllShardsSpawned,
            });
        } catch (error) {
            await Logger.error({
                message: Logs.error.managerSpawningShards,
                obj: error,
            });
            return;
        }

        if (debug.dummyMode.enabled) {
            return;
        }

        await startNewsChannel(this.shardManager);

        this.jobService.start();
    }

    private registerListeners(): void {
        this.shardManager.on('shardCreate', shard => this.onShardCreate(shard));
    }

    private async onShardCreate(shard: Shard): Promise<void> {
        Logger.info({
            message: Logs.info.managerLaunchedShard.replaceAll('{SHARD_ID}', shard.id.toString()),
        });
    }
}
