import { ActivityType, Client, ShardingManager } from 'discord.js';

import { Job } from './index.js';
import { botSites } from '../config/botSites.js';
import { config } from '../config/config.js';
import { CustomClient } from '../extensions/index.js';
import { BotSite } from '../models/config-models.js';
import { HttpService, Logger } from '../services/index.js';
import { ShardUtils } from '../utils/index.js';

export class UpdateServerCountJob implements Job {
    public name = 'Update Server Count';
    public schedule = '0 6 * * *';
    public log: boolean = config.jobs.updateServerCount.log;

    private botSites: BotSite[];

    constructor(private shardManager: ShardingManager, private httpService: HttpService) {
        this.botSites = botSites.filter(botSite => botSite.enabled);
    }

    public async run(): Promise<void> {
        let guildCount = await ShardUtils.guildCount(this.shardManager);
        let memberCount = await ShardUtils.memberCount(this.shardManager);

        let type = ActivityType.Listening;
        let name = `to ${guildCount.toLocaleString()} Communities`;
        let url = 'https://twitter.com/SyndicateNTWRK';

        await this.shardManager.broadcastEval(
            (client: CustomClient, context) => {
                return client.setPresence(context.type, context.name, context.url);
            },
            { context: { type, name, url } }
        );

        Logger.info({
            message: `Guild Count: ${guildCount.toLocaleString()}\n\nMember count: ${memberCount.toLocaleString()}`,
        });

        await this.shardManager.broadcastEval(broadcastStats, {
            context: { guildCount, memberCount },
        });
        // for (let botSite of this.botSites) {
        //     try {
        //         let body = JSON.parse(
        //             botSite.body.replaceAll('{{SERVER_COUNT}}', serverCount.toString())
        //         );
        //         let res = await this.httpService.post(botSite.url, botSite.authorization, body);

        //         if (!res.ok) {
        //             throw res;
        //         }
        //     } catch (error) {
        //         await Logger.error({
        //             message: Logs.error.updatedServerCountSite.replaceAll(
        //                 '{BOT_SITE}',
        //                 botSite.name
        //             ),
        //             obj: error,
        //         });
        //         continue;
        //     }
        //     await Logger.info({
        //         message: Logs.info.updatedServerCountSite.replaceAll('{BOT_SITE}', botSite.name),
        //     });
        // }
    }
}

export async function broadcastStats(
    client: Client,
    { guildCount, memberCount }: { guildCount: number; memberCount: number }
): Promise<void> {
    client.emit('botStats', { guildCount, memberCount });
}
