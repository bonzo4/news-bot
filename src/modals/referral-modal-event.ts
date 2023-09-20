import {
    ActionRowBuilder,
    Client,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { ModalDeferType, ModalSubmit } from './modalSubmit.js';
import { systemButtons, systemLinks } from '../buttons/system.js';
import { SetupMessages } from '../messages/setup.js';
import { AmbassadorCodeDbUtils } from '../utils/database/ambassador-code-db-utils.js';
import { ReferralDbUtils } from '../utils/index.js';
import { InteractionUtils } from '../utils/interaction-utils.js';

export function referralModal(setup: boolean): ModalBuilder {
    const modal = new ModalBuilder()
        .setTitle('Syndicate News')
        .setCustomId(`referralCode_${setup}`);

    const referral = new TextInputBuilder()
        .setCustomId('referralCode')
        .setLabel('Referral Code')
        .setPlaceholder('Enter referral Code')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents([referral]);

    modal.addComponents([row]);

    return modal;
}

export class ReferralModal implements ModalSubmit {
    ids = ['referralCode'];
    cooldown = new RateLimiter(1, 5000);
    deferType = ModalDeferType.NONE;
    requireGuild = true;
    requireAdmin = true;

    async execute(intr: ModalSubmitInteraction): Promise<void> {
        const setup = intr.customId.endsWith('true');

        if (setup) {
            if (intr.message.deletable) await intr.message.delete();
            await intr.channel.send({
                embeds: [SetupMessages.systemMessage()],
                components: [systemLinks(), systemButtons()],
            });
        }

        const code = intr.fields.getTextInputValue('referralCode');
        if (!code) {
            await InteractionUtils.warn(intr, 'Please enter a referral code');
            return;
        }

        let referralCode = await AmbassadorCodeDbUtils.getCodeByCode(code);

        if (!referralCode) {
            await InteractionUtils.warn(intr, 'Invalid referral code');
            return;
        }

        await ReferralDbUtils.createGuildReferral(intr.guild.id, referralCode.discord_id);

        await InteractionUtils.success(intr, 'Referral code used!');

        await intr.client.shard.broadcastEval(broadcastReferral, {
            context: { guildId: intr.guildId, userId: referralCode.discord_id },
        });
    }
}

export async function broadcastReferral(
    client: Client,
    { guildId, userId }: { guildId: string; userId: string }
): Promise<void> {
    client.emit('guildReferral', { guildId, userId });
}
