import { CacheType, CategoryChannel, CommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import {
    ChannelDbUtils,
    ChannelUtils,
    GuildSettingsDbUtils,
    InteractionUtils,
} from '../../utils/index.js';
import { NewsChannelsUtils } from '../../utils/news-channels-utils.js';
import { Command, CommandDeferType } from '../command.js';

export class NewsCommand implements Command {
    public names = ['news'];
    cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [
        'ViewChannel',
        'ManageChannels',
        'SendMessages',
        'ManageRoles',
        'EmbedLinks',
        'UseExternalEmojis',
        'ReadMessageHistory',
    ];
    requireAdmin?: boolean = true;
    requireGuild?: boolean = true;

    async execute(intr: CommandInteraction<CacheType>): Promise<void> {
        const guildSettings = await GuildSettingsDbUtils.getGuildSettings(intr.guildId);
        if (!guildSettings) {
            await InteractionUtils.warn(
                intr,
                `The Syndicate Bot has not been set up yet. Run **/setup** to set up the server.`
            );
            return;
        }
        if (!guildSettings.category_id) {
            await InteractionUtils.warn(
                intr,
                `Something went wrong with the setup. Please run **/setup** again.`
            );
            return;
        }
        const category = (await intr.guild.channels.fetch(
            guildSettings.category_id
        )) as CategoryChannel;
        if (!category) {
            await InteractionUtils.warn(
                intr,
                `Something went wrong with the setup. Please run **/setup** again.`
            );
            return;
        }
        const newsChannels = await ChannelDbUtils.getAllNewsChannelsByGuild(intr.guildId);
        if (newsChannels.length >= 5) {
            await InteractionUtils.warn(
                intr,
                `You can only have up to 5 news channels. You can manage them with **/channels**`
            );
            return;
        }
        const newsChannel = await ChannelUtils.createNewsChannel(category);
        await NewsChannelsUtils.sendLastThreeForGuild(newsChannel);
        await ChannelDbUtils.createGuildChannel(intr.guildId, newsChannel);
        await InteractionUtils.success(intr, `Created news channel ${newsChannel.toString()}`);
    }
}
