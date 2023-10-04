import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { EventData } from '../models/internal-models.js';
import { Logger } from '../services/logger.js';
import { DirectDbUtils } from '../utils/database/direct-db-utils.js';
import { DirectInteractionDbUtils } from '../utils/database/direct-interaction-db-utils.js';
import { EmbedDbUtils } from '../utils/database/embed-db-utils.js';
import { ChannelDbUtils, ChannelUtils, InteractionUtils } from '../utils/index.js';
import { NewsChannelsUtils } from '../utils/news-channels-utils.js';

export function directButtons(directId: number): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId(`direct_${directId}`)
            .setLabel('Sign Up')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📝'),
    ]);
}

export function unsubscribeButtons(directId: number): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId(`direct_unsubscribe_${directId}`)
            .setLabel('Unsubscribe')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🚫'),
    ]);
}

export class DirectButtons implements Button {
    ids: string[] = ['direct'];
    deferType = ButtonDeferType.REPLY;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        try {
            const { userData } = data;

            const directId = intr.customId.split('_')[1];

            if ('unsubscribe' === directId) {
                const directId = intr.customId.split('_')[2];

                const direct = await DirectDbUtils.getDirectById(parseInt(directId));

                const embed = await EmbedDbUtils.getEmbedById(direct.embed_id);

                await DirectInteractionDbUtils.createInteraction({
                    user_id: intr.user.id,
                    guild_id: intr.guildId,
                    news_id: embed.news_id,
                    direct_id: direct.id,
                });

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

            const newsChannel = await ChannelDbUtils.getDirectNewsChannel(userData.id);

            if (newsChannel) {
                await InteractionUtils.warn(
                    intr,
                    `You are already signed up for Syndicate Direct. To unsubscribe, use **/unsubscribe**.`
                );
                return;
            }

            const dmChannel = await ChannelUtils.createDirectChannel(intr.user);
            await ChannelDbUtils.createDirectChannel(userData.id, dmChannel);

            await NewsChannelsUtils.sendLastThreeForDirect(dmChannel);

            const direct = await DirectDbUtils.getDirectById(parseInt(directId));

            const embed = await EmbedDbUtils.getEmbedById(direct.embed_id);

            await DirectInteractionDbUtils.createInteraction({
                user_id: intr.user.id,
                guild_id: intr.guildId,
                news_id: embed.news_id,
                direct_id: direct.id,
            });

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
                userId: intr.user.id,
                guildId: intr.guildId,
            });
        }
    }
}
