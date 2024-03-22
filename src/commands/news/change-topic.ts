import { ChatInputCommandInteraction, Client, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventData } from '../../models/internal-models.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { Command, CommandDeferType } from '../index.js';

export class ChangeTopicCommand implements Command {
    names = ['change-topic'];
    cooldown = new RateLimiter(1, 5000);
    deferType = CommandDeferType.HIDDEN;
    requireClientPerms = [] as PermissionsString[];

    async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        if (data.staffRole?.staff_role !== 'ADMIN') {
            await InteractionUtils.warn(intr, 'You do not have permission to use this command.');
            return;
        }

        const topic = intr.options.getString('topic');
        if (!topic) {
            await InteractionUtils.send(intr, 'You must provide a topic.');
            return;
        }

        await intr.client.shard.broadcastEval(broadcastChangeTopic, {
            context: { topic },
        });

        await InteractionUtils.send(intr, `You have changed the topic.`);
    }
}

export async function broadcastChangeTopic(
    client: Client,
    { topic }: { topic: string }
): Promise<void> {
    client.emit('changeTopic', {
        topic,
    });
}
