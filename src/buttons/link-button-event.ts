import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import { config } from '../config/config.js';
import { Database } from '../types/supabase.js';
import { RedirectDbUtils } from '../utils/database/redirect-db-utils.js';

type Link = Database['public']['Tables']['links']['Row'];

type LinkButtonOptions = {
    link: Link;
    newsId: number;
};

type LinkButtonForGuildOptions = {
    guildId: string;
} & LinkButtonOptions;

type LinkButtonForDirectOptions = {
    userId: string;
} & LinkButtonOptions;

export function linkButton(link: Link): ActionRowBuilder<ButtonBuilder> {
    const button = new ButtonBuilder()
        .setLabel(link.text)
        .setStyle(ButtonStyle.Link)
        .setURL(link.url);

    if (link.emoji) button.setEmoji(link.emoji);
    return new ActionRowBuilder<ButtonBuilder>().addComponents(button);
}

export async function linkButtonForGuild(
    options: LinkButtonForGuildOptions
): Promise<ActionRowBuilder<ButtonBuilder>> {
    const { link, newsId, guildId } = options;
    const redirect = await RedirectDbUtils.createRedirect({
        news_id: newsId,
        url: link.url,
        guild_id: guildId,
    });
    const button = new ButtonBuilder()
        .setLabel(link.text)
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.redirectUri}/${redirect.id}`);

    if (link.emoji) button.setEmoji(link.emoji);
    return new ActionRowBuilder<ButtonBuilder>().addComponents(button);
}

export async function linkButtonForDirect(
    options: LinkButtonForDirectOptions
): Promise<ActionRowBuilder<ButtonBuilder>> {
    const { link, newsId, userId } = options;

    const redirect = await RedirectDbUtils.createRedirect({
        news_id: newsId,
        url: link.url,
        user_id: userId,
    });

    const button = new ButtonBuilder()
        .setLabel(link.text)
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.redirectUri}/${redirect.id}`);

    if (link.emoji) button.setEmoji(link.emoji);
    return new ActionRowBuilder<ButtonBuilder>().addComponents(button);
}
