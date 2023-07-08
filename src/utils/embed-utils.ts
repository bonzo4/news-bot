import { Embed } from 'discord.js';

import { EmbedDoc } from './database/embed-db-utils.js';
import { NewsTrackerDbUtils } from './database/news-image-db-utils.js';
import { RedirectDbUtils } from './database/redirect-db-utils.js';
import { config } from '../config/config.js';
import { Json } from '../types/supabase.js';

type EmbedFormatOptions = {
    embed: EmbedDoc;
};

type GuildEmbedFormatOptions = {
    guildId: string;
} & EmbedFormatOptions;

type UserEmbedFormatOptions = {
    userId: string;
} & EmbedFormatOptions;

type EmbedLinkOptions = {
    content: any;
} & EmbedFormatOptions;

type GuildEmbedLinkOptions = {
    guildId: string;
} & EmbedLinkOptions;

type UserEmbedLinkOptions = {
    userId: string;
} & EmbedLinkOptions;

export class EmbedUtils {
    public static removeId(content: Json): any {
        let parsedContent = JSON.parse(content.toString());
        if (parsedContent.id) delete parsedContent.id;
        return parsedContent;
    }

    public static async formatEmbedForGuild(options: GuildEmbedFormatOptions): Promise<any> {
        const { embed, guildId } = options;
        const content = this.removeId(embed.content);
        let formattedContent = await this.formatLinksForGuild({
            content,
            embed,
            guildId,
        });
        if (embed.order === 0)
            formattedContent = await this.formatFooterForGuild({
                embed,
                guildId,
                content: formattedContent,
            });
        return formattedContent;
    }

    public static async formatLinksForGuild(options: GuildEmbedLinkOptions): Promise<any> {
        const { content, guildId, embed } = options;
        const links = this.getAllLinks(content);
        const formattedLinks = [];

        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const redirect = await RedirectDbUtils.createRedirect({
                url: link,
                news_id: embed.news_id,
                guild_id: guildId,
            });
            const formattedLink = `${config.redirectUri}/${redirect.id}`;
            formattedLinks.push(formattedLink);
        }

        return this.replaceLinks(content, links, formattedLinks);
    }

    public static async formatFooterForGuild(options: GuildEmbedLinkOptions): Promise<any> {
        const { content, guildId, embed } = options;
        const newsImage = await NewsTrackerDbUtils.createNewsTracker({
            news_id: embed.news_id,
            guild_id: guildId,
        });
        const newImage = `${config.imageUrl}/${newsImage.id}`;
        const formattedContent = this.replaceFooter(content, newImage);
        return formattedContent;
    }

    public static async formatEmbedForDirect(options: UserEmbedFormatOptions): Promise<any> {
        const { embed, userId } = options;
        const content = this.removeId(embed.content);
        let formattedContent = await this.formatLinksForDirect({
            content,
            embed,
            userId,
        });
        if (embed.order === 0)
            formattedContent = await this.formatFooterForDirect({
                embed,
                userId,
                content: formattedContent,
            });
        return formattedContent;
    }

    public static async formatLinksForDirect(options: UserEmbedLinkOptions): Promise<any> {
        const { embed, userId, content } = options;
        const links = this.getAllLinks(content);
        const formattedLinks = [];

        for (const link of links) {
            const redirect = await RedirectDbUtils.createRedirect({
                url: link,
                news_id: embed.news_id,
                user_id: userId,
            });
            const formattedLink = `${config.redirectUri}/${redirect.id}`;
            formattedLinks.push(formattedLink);
        }

        return this.replaceLinks(content, links, formattedLinks);
    }

    public static async formatFooterForDirect(options: UserEmbedLinkOptions): Promise<any> {
        const { embed, userId, content } = options;
        const newsImage = await NewsTrackerDbUtils.createNewsTracker({
            news_id: embed.news_id,
            user_id: userId,
        });
        const newImage = `${config.imageUrl}/${newsImage.id}`;
        const formattedContent = this.replaceFooter(content, newImage);
        return formattedContent;
    }

    private static replaceFooter(content: any, newImage: string): any {
        const contentWithFooter: Embed = {
            ...content,
            footer: {
                text: 'Powered by Syndicate',
                ...content.footer,
                iconURL: newImage,
            },
        };
        return contentWithFooter;
    }

    private static replaceLinks(content: any, oldLinks: string[], newLinks: string[]): any {
        let contentString = JSON.stringify(content);
        for (let i = 0; i < oldLinks.length; i++) {
            contentString = contentString.replace(oldLinks[i], newLinks[i]);
        }
        return JSON.parse(contentString);
    }

    private static getAllLinks(content: any): string[] {
        const links: string[] = [];
        function traverse(content: any): void {
            if (Array.isArray(content)) {
                content.forEach(item => traverse(item));
            } else if (typeof content === 'object' && content !== null) {
                for (const key in content) {
                    if (key !== 'image' && key !== 'footer') {
                        traverse(content[key]);
                    }
                }
            } else if (typeof content === 'string') {
                const regex =
                    /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])/gim;

                const matches = content.match(regex);
                if (matches) {
                    links.push(...matches);
                }
            }
        }

        traverse(content);

        return links;
    }
}
