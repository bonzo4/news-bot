import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CategoryChannel,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './index.js';
import { setupMentionButtons } from './setup-button-5.js';
import { addMentionMenu } from '../menus/mention-add-menu-event.js';
import { SetupMessages } from '../messages/setup.js';
import { Logger } from '../services/logger.js';
import { GuildSettings } from '../utils/database/guild-settings-db-utils.js';
import {
    ChannelDbUtils,
    ChannelUtils,
    GuildSettingsDbUtils,
    InteractionUtils,
} from '../utils/index.js';
import { NewsChannelsUtils } from '../utils/news-channels-utils.js';

export function setupNewsChannelButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('setupNewsChannel')
            .setLabel('Setup')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛠️'),
        new ButtonBuilder()
            .setCustomId('setupNewsChannel_skip')
            .setLabel('Skip')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌'),
    ]);
}

export class SetupNewsChannelButtons implements Button {
    ids: string[] = ['setupNewsChannel'];
    deferType = ButtonDeferType.REPLY;
    requireGuild = true;
    cooldown = new RateLimiter(1, 5000);
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            const guildSettings = await GuildSettingsDbUtils.getGuildSettings(intr.guildId);
            if (!guildSettings) {
                await InteractionUtils.warn(
                    intr,
                    `Something went wrong with the setup. Please run **/setup** again.`
                );
                return;
            }
            if (intr.customId.split('_')[1] === 'skip') {
                await InteractionUtils.send(intr, SetupMessages.pingRole(), true, [
                    addMentionMenu(),
                    setupMentionButtons(),
                ]);
                return;
            }

            await this.createNewsChannel(intr, guildSettings);
        } catch (error) {
            await InteractionUtils.warn(
                intr,
                `Something went wrong with the setup. Please run **/setup** again.`
            );
            await Logger.error({
                message: `Error setting up : ${error.message ? error.message : error}`,
                guildId: intr.guildId,
                userId: intr.user.id,
            });
        }
    }

    private async createNewsChannel(
        intr: ButtonInteraction,
        guildSettings: GuildSettings
    ): Promise<void> {
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
            await InteractionUtils.send(intr, SetupMessages.pingRole(), true, [
                addMentionMenu(),
                setupMentionButtons(),
            ]);
            return;
        }
        const newsChannel = await ChannelUtils.createNewsChannel(category);
        await ChannelDbUtils.createGuildChannel(guildSettings, newsChannel);
        await InteractionUtils.send(intr, SetupMessages.pingRole(), true, [
            addMentionMenu(),
            setupMentionButtons(),
        ]);
        await NewsChannelsUtils.sendLastThreeForGuild(newsChannel);
    }
}
