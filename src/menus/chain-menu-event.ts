import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Menu, MenuDeferType } from './menu.js';
import { setupNewsChannelButtons } from '../buttons/setup-button-3.js';
import { SetupMessages } from '../messages/setup.js';
import { TagDbUtils } from '../utils/database/tags-db.utils.js';
import { InteractionUtils } from '../utils/index.js';

export async function setupChainMenu(): Promise<ActionRowBuilder<StringSelectMenuBuilder>> {
    const tags = await TagDbUtils.getAllTags();

    const tagNames = tags
        .filter(tag => tag.name !== 'all' && tag.name !== 'guild' && tag.name !== 'direct')
        .map(tag => tag.name);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
        new StringSelectMenuBuilder()
            .setCustomId('chain')
            .setPlaceholder('Select a tag')
            .addOptions(
                tagNames.map(tagName => ({
                    label: tagName,
                    value: tagName,
                }))
            ),
    ]);
}

export class SetupChainMenu implements Menu {
    public ids = ['chain'];
    public cooldown = new RateLimiter(1, 5000);
    deferType = MenuDeferType.REPLY;
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
                'You can only have one chain tag per guild. Please join the Syndicate Server to inquire about other chains.'
            );
            return;
        }

        await TagDbUtils.addGuildTag(intr.guildId, tag);

        await InteractionUtils.send(intr, SetupMessages.newsChannel(), true, [
            setupNewsChannelButtons(),
        ]);
    }
}
