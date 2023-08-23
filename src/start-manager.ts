import { ShardingManager } from 'discord.js';
import { createRequire } from 'node:module';
import 'reflect-metadata';

import { config } from './config/config.js';
import { debug } from './config/debug.js';
import { GuildsController, RootController, ShardsController } from './controllers/index.js';
import { Job, UpdateServerCountJob } from './jobs/index.js';
import { Api } from './models/api.js';
import { Manager } from './models/manager.js';
import { HttpService, JobService, Logger, MasterApiService } from './services/index.js';

const require = createRequire(import.meta.url);
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    Logger.info({
        message: Logs.info.appStarted,
    });

    // Dependencies
    let httpService = new HttpService();
    let masterApiService = new MasterApiService(httpService);
    if (config.clustering.enabled) {
        await masterApiService.register();
    }

    // Sharding
    // let totalShards: number;
    // try {
    //     if (config.clustering.enabled) {
    //         let resBody = await masterApiService.login();
    //         shardList = resBody.shardList;
    // let requiredShards = await ShardUtils.requiredShardCount(
    //     config.client.token || process.env.TOKEN
    // );
    //         totalShards = Math.max(requiredShards, resBody.totalShards);
    //     } else {
    // let recommendedShards = await ShardUtils.recommendedShardCount(
    //     config.client.token || process.env.TOKEN,
    //     config.sharding.serversPerShard
    // );
    //         shardList = MathUtils.range(0, recommendedShards);
    //         totalShards = recommendedShards;
    //     }
    // } catch (error) {
    //     await Logger.error({
    //         message: Logs.error.retrieveShards,
    //         obj: error,
    //     });
    //     return;
    // }

    // if (shardList.length === 0) {
    //     Logger.warn({
    //         message: Logs.warn.managerNoShards,
    //     });
    //     return;
    // }

    const shardCount = 7;

    const shardList = Array.from({ length: shardCount }, (_, i) => i);

    let shardManager = new ShardingManager('dist/start-bot.js', {
        token: config.client.token || process.env.TOKEN,
        mode: debug.override.shardMode.enabled ? 'worker' : 'process',
        respawn: true,
        totalShards: shardCount,
        shardList,
    });

    // Jobs
    let jobs: Job[] = [
        config.clustering.enabled ? undefined : new UpdateServerCountJob(shardManager, httpService),
        // config.clustering.enabled ? undefined : new RestartShardsJobs(shardManager),
        // TODO: Add new jobs here
    ].filter(Boolean);

    let manager = new Manager(shardManager, new JobService(jobs));

    // API
    let guildsController = new GuildsController(shardManager);
    let shardsController = new ShardsController(shardManager);
    let rootController = new RootController();
    let api = new Api([guildsController, shardsController, rootController]);

    // Start
    await manager.start();
    await api.start();
    if (config.clustering.enabled) {
        await masterApiService.ready();
    }
}

process.on('unhandledRejection', (reason, _promise) => {
    Logger.error({
        message: `An unhandled promise rejection occurred.\n${reason}`,
        obj: reason,
    });
});

start().catch(async error => {
    await Logger.error({
        message: `An error occurred while starting the manager.\n${error}`,
        obj: error,
    });
});
