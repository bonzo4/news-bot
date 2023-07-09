import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CategoryChannel,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { channelButtons } from './channel-button-event.js';
import { Button, ButtonDeferType } from './index.js';
import { mentionButtons } from './mention-button-event.js';
import {
    ChannelDbUtils,
    ChannelUtils,
    GuildSettingsDbUtils,
    InteractionUtils,
} from '../utils/index.js';
import { NewsChannelsUtils } from '../utils/news-channels-utils.js';

export function systemButtons(): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>();

    const newsButton = new ButtonBuilder()
        .setCustomId(`system_news`)
        .setLabel('News')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📰');

    const channelButtons = new ButtonBuilder()
        .setCustomId(`system_channels`)
        .setLabel('Channels')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📺');

    const mentionButton = new ButtonBuilder()
        .setCustomId(`system_mention`)
        .setLabel('Mention')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📢');

    const helpButton = new ButtonBuilder()
        .setCustomId(`system_help`)
        .setLabel('Help')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('❓');

    const moreNewsButton = new ButtonBuilder()
        .setCustomId('system_moreNews')
        .setLabel('Get more news')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔗');

    row.addComponents([newsButton, channelButtons, mentionButton, helpButton, moreNewsButton]);

    return row;
}

export function systemLinks(): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>();

    const discordLink = new ButtonBuilder()
        .setLabel('Discord')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/syndicatenetwork');

    const twitterLink = new ButtonBuilder()
        .setLabel('Twitter')
        .setStyle(ButtonStyle.Link)
        .setURL('https://twitter.com/SyndicateNTWRK');

    const threadsLink = new ButtonBuilder()
        .setLabel('Threads (By Instagram)')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.threads.net/@syndicatenetwork_');

    const telegramLink = new ButtonBuilder()
        .setLabel('Join our telegram for founders')
        .setStyle(ButtonStyle.Link)
        .setURL('https://t.me/+2RFMCPVu2xk4ODFh');

    row.addComponents([discordLink, twitterLink, threadsLink, telegramLink]);

    return row;
}

export class SystemButtons implements Button {
    ids: string[] = ['system'];
    deferType = ButtonDeferType.REPLY;
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction): Promise<void> {
        intr;
        switch (intr.customId.split('_')[1]) {
            case 'news': {
                this.createNewsChannel(intr);
                break;
            }
            case 'channels': {
                await InteractionUtils.success(intr, 'Manage your Syndicate News channels.', [
                    channelButtons(),
                ]);
                break;
            }
            case 'mention': {
                await InteractionUtils.success(intr, 'Mention a Role when news gets sent out.', [
                    mentionButtons(),
                ]);
                break;
            }
            case 'help': {
                await InteractionUtils.success(
                    intr,
                    'Please go here for help: **https://discord.gg/syndicatenetwork**.'
                );
                break;
            }
            case 'moreNews': {
                await InteractionUtils.success(
                    intr,
                    'Please open a ticket here: **https://discord.gg/syndicatenetwork** to inquire about more news.'
                );
            }
        }
    }

    private async createNewsChannel(intr: ButtonInteraction): Promise<void> {
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
        const newsChannels = await ChannelDbUtils.getAllNewsChannelsByGuild(guildSettings);
        if (newsChannels.length >= 5) {
            await InteractionUtils.warn(
                intr,
                `You can only have up to 5 news channels. You can manage them with **/channels**`
            );
            return;
        }
        const newsChannel = await ChannelUtils.createNewsChannel(category);
        await NewsChannelsUtils.sendLastThreeForGuild(newsChannel);
        await ChannelDbUtils.createGuildChannel(guildSettings, newsChannel);
        await InteractionUtils.success(intr, `Created news channel ${newsChannel.toString()}`);
    }
}
