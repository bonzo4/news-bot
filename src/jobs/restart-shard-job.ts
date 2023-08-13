import { ShardingManager } from 'discord.js';

import { Job } from './index.js';
import { config } from '../config/config.js';
import { CustomClient } from '../extensions/index.js';

export class RestartShardsJobs implements Job {
    public name = 'Update Server Count';
    public schedule = '50 5 * * *';
    public log: boolean = config.jobs.updateServerCount.log;

    constructor(private shardManager: ShardingManager) {}

    public async run(): Promise<void> {
        await this.shardManager.broadcastEval((_c: CustomClient) => {
            process.exit();
        });

        await this.shardManager.spawn();
    }
}
