import schedule from 'node-schedule';
import { createRequire } from 'node:module';

import { Logger } from './index.js';
import { Job } from '../jobs/index.js';

const require = createRequire(import.meta.url);
let Logs = require('../../lang/logs.json');

export class JobService {
    constructor(private jobs: Job[]) {}

    public async start(): Promise<void> {
        for (let job of this.jobs) {
            schedule.scheduleJob(job.schedule, async () => {
                try {
                    if (job.log) {
                        Logger.info({
                            message: Logs.info.jobRun.replaceAll('{JOB}', job.name),
                        });
                    }

                    await job.run();

                    if (job.log) {
                        Logger.info({
                            message: Logs.info.jobCompleted.replaceAll('{JOB}', job.name),
                        });
                    }
                } catch (error) {
                    await Logger.error({
                        message: Logs.error.job.replaceAll('{JOB}', job.name),
                        obj: error,
                    });
                }
            });
            Logger.info({
                message: Logs.info.jobScheduled
                    .replaceAll('{JOB}', job.name)
                    .replaceAll('{SCHEDULE}', job.schedule),
            });
        }
    }
}
