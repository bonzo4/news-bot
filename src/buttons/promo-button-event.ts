import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { EventData } from '../models/internal-models.js';
import { EmbedDbUtils } from '../utils/database/embed-db-utils.js';
import { Promo, PromoDbUtils } from '../utils/database/promo-db-utils.js';
import { PromoInteractionDbUtils } from '../utils/database/promo-interaction-db-utils.js';
import { InteractionUtils } from '../utils/interaction-utils.js';

export function promoButtons(promo: Promo): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>();
    if (promo.twitter_url) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`promo_follow_${promo.id}`)
                .setLabel('Follow')
                .setStyle(ButtonStyle.Primary)
        );
    }
    if (promo.tweet_url) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`promo_like_${promo.id}`)
                .setLabel('Like')
                .setStyle(ButtonStyle.Primary)
        );
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`promo_retweet_${promo.id}`)
                .setLabel('Retweet')
                .setStyle(ButtonStyle.Primary)
        );
    }

    return row;
}

export class PromoButtons implements Button {
    ids: string[] = ['promo'];
    deferType = ButtonDeferType.NONE;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        try {
            const userData = data.userData;

            const promoId = parseInt(intr.customId.split('_')[2]);
            const promo = await PromoDbUtils.getPromoById(promoId);
            const embed = await EmbedDbUtils.getEmbedById(promo.embed_id);

            if (intr.customId.split('_')[1] === 'follow') {
                const screenName = promo.twitter_url.split('https://x.com/')[1];
                const url = `https://x.com/intent/user?screen_name=${screenName}`;

                await PromoInteractionDbUtils.createInteraction({
                    promo_button_id: promoId,
                    news_id: embed.news_id,
                    user_id: userData.id,
                    type: 'FOLLOW',
                });

                await intr.reply({
                    ephemeral: true,
                    content: `Click here to follow ${screenName} on X: ${url}`,
                });
            }
            if (intr.customId.split('_')[1] === 'like') {
                const tweetId = promo.tweet_url.split('/')[5];
                const url = `https://x.com/intent/like?tweet_id=${tweetId}`;

                await PromoInteractionDbUtils.createInteraction({
                    promo_button_id: promoId,
                    news_id: embed.news_id,
                    user_id: userData.id,
                    type: 'LIKE',
                });

                await intr.reply({
                    ephemeral: true,
                    content: `Click here to like the Post: ${url}`,
                });
            }

            if (intr.customId.split('_')[1] === 'retweet') {
                const tweetId = promo.tweet_url.split('/')[5];
                const url = `https://x.com/intent/retweet?tweet_id=${tweetId}`;

                await PromoInteractionDbUtils.createInteraction({
                    promo_button_id: promoId,
                    news_id: embed.news_id,
                    user_id: userData.id,
                    type: 'RETWEET',
                });

                await intr.reply({
                    ephemeral: true,
                    content: `Click here to retweet the Post: ${url}`,
                });
            }
        } catch (error) {
            console.error(error);
            await InteractionUtils.error(
                intr,
                `There was an error using this follow button. Please contact a staff member or try again later.`
            );
        }
    }
}
