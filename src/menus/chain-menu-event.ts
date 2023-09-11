import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Menu, MenuDeferType } from './menu.js';
import { setupNewsChannelButtons } from '../buttons/setup/setup-button-4.js';
import { SetupMessages } from '../messages/setup.js';
import { TagDbUtils } from '../utils/database/tags-db.utils.js';
import { InteractionUtils } from '../utils/index.js';

export async function setupChainMenu(): Promise<ActionRowBuilder<StringSelectMenuBuilder>> {
    const tags = await TagDbUtils.getAllTags();

    const tagNames = tags
        .filter(tag => tag.name === 'Solana' || tag.name === 'Ethereum')
        .map(tag => tag.name);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
        new StringSelectMenuBuilder()
            .setCustomId('chain')
            .setPlaceholder('Select a tag')
            .addOptions(
                tagNames.map(tagName => ({
                    label: tagName + ' NFT',
                    value: tagName,
                }))
            ),
    ]);
}

export class SetupChainMenu implements Menu {
    public ids = ['chain'];
    public cooldown = new RateLimiter(1, 5000);
    deferType = MenuDeferType.NONE;
    requireGuild = true;
    requireAdmin = true;

    async execute(intr: StringSelectMenuInteraction): Promise<void> {
        const tag = intr.values[0];

        if (!tag) {
            await InteractionUtils.warn(intr, 'Please select a valid tag');
        }

        const tags = await TagDbUtils.getAllGuildTags(intr.guildId);
        if (tags.length > 0) {
            await InteractionUtils.warn(
                intr,
                'You can only have one chain tag per guild. Please run **/premium** to learn more about getting news for all chains.'
            );
            if (intr.message.deletable) await intr.message.delete();
            await intr.channel.send({
                embeds: [SetupMessages.newsChannel()],
                components: [setupNewsChannelButtons()],
            });
            return;
        }

        await TagDbUtils.addGuildTag(intr.guildId, tag);

        if (intr.message.deletable) await intr.message.delete();
        await intr.channel.send({
            embeds: [SetupMessages.newsChannel()],
            components: [setupNewsChannelButtons()],
        });
    }
}
