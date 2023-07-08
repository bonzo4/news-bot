import { CommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventData } from '../../models/internal-models.js';
import { ChannelDbUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class UnsubscribeCommand implements Command {
    public names = ['unsubscribe'];
    cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let dmChannel = await ChannelDbUtils.getDirectNewsChannel(data.userData.id);
        if (!dmChannel) {
            await InteractionUtils.warn(
                intr,
                `You are not signed up for Syndicate Direct. To subscribe, use **/direct**.`
            );
            return;
        }
        const channel = await intr.client.channels.fetch(dmChannel.id);
        if (channel) await channel.delete();
        await ChannelDbUtils.deleteDirectChannel(dmChannel);
        await InteractionUtils.success(
            intr,
            `You have been unsubscribed from Syndicate Direct. To resubscribe, use **/direct**.`
        );
    }
}
