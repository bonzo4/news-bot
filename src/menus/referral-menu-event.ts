import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Menu, MenuDeferType } from './menu.js';
import { previewButtons } from '../buttons/setup/setup-button-2.js';
import { SetupMessages } from '../messages/setup.js';
import { Logger } from '../services/logger.js';
import { AmbassadorCodeDbUtils } from '../utils/database/ambassador-code-db-utils.js';
import ReferralCodeDbUtils from '../utils/database/referral-code-db-utils.js';
import { GuildReferralDbUtils } from '../utils/database/referral-db-utils.js';
import { InteractionUtils } from '../utils/index.js';

export async function referralSelectMenu(): Promise<ActionRowBuilder<StringSelectMenuBuilder>> {
    const ambassadorCodes = await AmbassadorCodeDbUtils.getCodes();
    const referralCodes = await ReferralCodeDbUtils.getCodes();

    const codes = [...ambassadorCodes, ...referralCodes];
    codes
        .sort((a, b) => {
            if (a.last_accessed > b.last_accessed) return -1;
            if (a.last_accessed < b.last_accessed) return 1;
            return 0;
        })
        .splice(0, 25);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>();
    const menu = new StringSelectMenuBuilder()
        .setCustomId('referralSelectMenu')
        .setPlaceholder('Have a referral Code ?')
        .setMinValues(1)
        .setMaxValues(1);
    codes.splice(0, 25).forEach(ambassador => {
        menu.addOptions([
            {
                label: ambassador.code,
                value: ambassador.discord_id,
            },
        ]);
    });
    row.addComponents(menu);
    return row;
}

export class ReferralSelectMenu implements Menu {
    ids: string[] = ['referralSelectMenu'];
    deferType = MenuDeferType.NONE;
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = false;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: StringSelectMenuInteraction): Promise<void> {
        try {
            const referral = await GuildReferralDbUtils.getReferralByGuildId(intr.guildId);

            if (referral.discord_user_id) {
                await InteractionUtils.warn(
                    intr,
                    `You have already set up a referral for this server.`
                );
                if (intr.message.deletable) await intr.message.delete();
                await intr.channel.send({
                    embeds: [SetupMessages.newsPreview()],
                    components: [previewButtons()],
                });
                await InteractionUtils.success(intr, 'Setup complete');
                return;
            }

            const code = intr.values[0];
            if (!code) {
                await InteractionUtils.warn(intr, 'Please select a valid code.');
                return;
            }

            let referralCode = await AmbassadorCodeDbUtils.getCodeByCode(code);

            if (referralCode) {
                await GuildReferralDbUtils.createAmbassadorReferral(
                    intr.guild.id,
                    referralCode.discord_id
                );

                await InteractionUtils.success(intr, 'Referral code used!');
            }

            referralCode = await ReferralCodeDbUtils.getCodeByCode(code);

            if (referralCode) {
                await GuildReferralDbUtils.createProfileReferral(
                    intr.guild.id,
                    referralCode.discord_id
                );

                await InteractionUtils.success(intr, 'Referral code used!');
            }

            if (!referralCode) {
                await InteractionUtils.warn(intr, 'Invalid referral code');
                return;
            }

            if (intr.message.deletable) await intr.message.delete();
            await intr.channel.send({
                embeds: [SetupMessages.newsPreview()],
                components: [previewButtons()],
            });
        } catch (error) {
            await InteractionUtils.warn(
                intr,
                'There was an error setting up please contact staff for assistance'
            );
            await Logger.error({
                message: `Error setting up : ${error.message ? error.message : error}`,
                guildId: intr.guildId,
                userId: intr.user.id,
            });
        }
    }
}
