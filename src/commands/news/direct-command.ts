import { CommandInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventData } from '../../models/internal-models.js';
import { Logger } from '../../services/index.js';
import { ChannelDbUtils, ChannelUtils, InteractionUtils } from '../../utils/index.js';
import { NewsChannelsUtils } from '../../utils/news-channels-utils.js';
import { Command, CommandDeferType } from '../index.js';

export class DirectCommand implements Command {
    public names = ['direct'];
    cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.HIDDEN;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        try {
            const newsChannel = await ChannelDbUtils.getDirectNewsChannel(data.userData.id);
            if (newsChannel) {
                await InteractionUtils.warn(
                    intr,
                    `You are already signed up for Syndicate Direct. To unsubscribe, use **/unsubscribe**.`
                );
                return;
            }

            const dmChannel = await ChannelUtils.createDirectChannel(intr.user);
            await ChannelDbUtils.createDirectChannel(data.userData.id, dmChannel);

            await NewsChannelsUtils.sendLastThreeForDirect(dmChannel);

            await InteractionUtils.success(
                intr,
                `Thank you for signing up for Syndicate Direct! You will now receive DMs for all news posts. To unsubscribe, use **/unsubscribe**.`
            );
        } catch (err) {
            await InteractionUtils.error(
                intr,
                `Could not setup Syndicate Direct at this time please contact staff for assistance.`
            );
            await Logger.error({
                message: `Could not setup Syndicate Direct:\n${err}`,
            });
        }
    }
}
