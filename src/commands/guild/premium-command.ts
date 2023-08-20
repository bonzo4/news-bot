import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { GuildDbUtils, GuildSettingsDbUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export const premiumEmbed = [
    new EmbedBuilder()
        .setTitle('🌟┃Syndicate Premium')
        .setDescription(
            `Syndicate Premium is a subscription service that allows you to unlock premium news features for your server. [More info](https://www.syndicatenetwork.io/#premium).`
        )
        .addFields([
            {
                name: '📰┃Premium News',
                value: `• Full NFT news coverage\n• Advanced NFT market stats\n• Additional custom Web3 content\n• Exclusive access to Syndicate merch and airdrops\n• Exclusive access to whitelists and presales`,
            },
            {
                name: '**Pay using Card**',
                value: '[Powered by Whop](https://whop.com/checkout/plan_GywqOTshW7cHG?d2c=true)\n',
            },
            {
                name: '**Pay using ETH**',
                value: '[Powered by Whop](https://whop.com/checkout/plan_GywqOTshW7cHG?d2c=true)\n',
            },
            {
                name: '**Pay using Solana**',
                value: '[Powered by Helio](https://www.hel.io/s/64d6968c2fccaf03133b80dc)\n',
            },
        ]),
];

export class PremiumCommand implements Command {
    names = ['premium'];
    requireAdmin = true;
    requireGuild = true;
    cooldown = new RateLimiter(1, 5000);
    deferType = CommandDeferType.NONE;

    async execute(intr: CommandInteraction): Promise<void> {
        const guildDoc = await GuildDbUtils.getGuildById(intr.guildId);
        const guildSettings = await GuildSettingsDbUtils.getGuildSettings(intr.guildId);

        if (!guildDoc || !guildSettings) {
            await InteractionUtils.warn(
                intr,
                `This server has not been set up yet. Please run \`/setup\` first.`
            );
        }

        await InteractionUtils.send(
            intr,
            {
                embeds: premiumEmbed
            },
            true
        );
    }
}
