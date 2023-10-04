import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CategoryChannel,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { setupMentionButtons } from './setup-button-5.js';
import { addMentionMenu } from '../../menus/mention-add-menu-event.js';
import { SetupMessages } from '../../messages/setup.js';
import { Logger } from '../../services/logger.js';
import { GuildSettings } from '../../utils/database/guild-settings-db-utils.js';
import {
    ChannelDbUtils,
    ChannelUtils,
    GuildSettingsDbUtils,
    InteractionUtils,
} from '../../utils/index.js';
import { NewsChannelsUtils } from '../../utils/news-channels-utils.js';
import { Button, ButtonDeferType } from '../button.js';

export function setupNewsChannelButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('setupNewsChannel')
            .setLabel('Setup')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛠️'),
    ]);
}

export class SetupNewsChannelButtons implements Button {
    ids: string[] = ['setupNewsChannel'];
    deferType = ButtonDeferType.NONE;
    requireGuild = true;
    cooldown = new RateLimiter(1, 5000);
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            // 1. fetch guild settings
            const guildSettings = await GuildSettingsDbUtils.getGuildSettings(intr.guildId);

            // 2. if there are no guild settings, something went wrong with the setup
            if (!guildSettings) {
                await InteractionUtils.warn(
                    intr,
                    `Something went wrong with the setup. Please run **/setup** again.`
                );
                return;
            }

            // 3. create the news channel
            await this.createNewsChannel(intr, guildSettings);

            // 4. go to the next step
            if (intr.message.deletable) await intr.message.delete();
            await intr.channel.send({
                embeds: [SetupMessages.pingRole()],
                components: [
                    addMentionMenu([...intr.guild.roles.cache.map(role => role)]),
                    setupMentionButtons(),
                ],
            });
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
            if (intr.message.deletable) await intr.message.delete();
            await intr.channel.send({
                embeds: [SetupMessages.pingRole()],
                components: [
                    addMentionMenu([...intr.guild.roles.cache.map(role => role)]),
                    setupMentionButtons(),
                ],
            });
            return;
        }
        const newsChannel = await ChannelUtils.createNewsChannel(category);
        await ChannelDbUtils.createGuildChannel(guildSettings, newsChannel);

        await NewsChannelsUtils.sendLastThreeForGuild(newsChannel);
    }
}
