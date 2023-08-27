import { Client, ShardingManager } from 'discord.js';

import { Job } from './index.js';
import { botSites } from '../config/botSites.js';
import { config } from '../config/config.js';
import { BotSite } from '../models/config-models.js';
import { HttpService } from '../services/index.js';
export class UpdateServerCountJob implements Job {
    public name = 'Update Server Count';
    public schedule = '0 6 * * SUN';
    public log: boolean = config.jobs.updateServerCount.log;

    private botSites: BotSite[];

    constructor(private shardManager: ShardingManager, private httpService: HttpService) {
        this.botSites = botSites.filter(botSite => botSite.enabled);
    }

    public async run(): Promise<void> {

        await this.shardManager.broadcastEval(broadcastUpdate);
    }
}

export async function broadcastUpdate(
    client: Client,
): Promise<void> {
    client.emit('weeklyUpdate');
}
