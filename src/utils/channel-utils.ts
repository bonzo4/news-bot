import {
    CategoryChannel,
    ChannelType,
    DMChannel,
    Guild,
    OverwriteResolvable,
    PermissionFlagsBits,
    TextChannel,
    User,
} from 'discord.js';

import { config } from '../config/config.js';

type CreateChannelOptions = {
    name: string;
    parent: CategoryChannel;
    permissionOverwrites: OverwriteResolvable[];
};

export class ChannelUtils {
    public static async createParent(guild: Guild): Promise<CategoryChannel> {
        try {
            const parent = await guild.channels.create({
                name: 'Syndicate',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: config.client.id,
                        allow: [
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ManageChannels,
                        ],
                    },
                ],
            });
            return parent;
        } catch (err) {
            throw new Error(err);
        }
    }

    public static async createChannel(options: CreateChannelOptions): Promise<TextChannel> {
        try {
            const { name, parent, permissionOverwrites } = options;
            const channel = await parent.children.create({
                name,
                type: ChannelType.GuildText,
                permissionOverwrites,
            });
            return channel;
        } catch (err) {
            throw new Error(err);
        }
    }

    public static async createSystemChannel(parent: CategoryChannel): Promise<TextChannel> {
        try {
            const channel = await this.createChannel({
                name: 'syndicate-system',
                parent,
                permissionOverwrites: [
                    {
                        id: config.client.id,
                        allow: [
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ManageChannels,
                        ],
                    },
                    {
                        id: parent.guild.roles.everyone,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                ],
            });
            return channel;
        } catch (err) {
            throw new Error(err);
        }
    }

    public static async createNewsChannel(parent: CategoryChannel): Promise<TextChannel> {
        try {
            const channel = await this.createChannel({
                name: '⚪┃syndicate-news',
                parent,
                permissionOverwrites: [
                    {
                        id: config.client.id,
                        allow: [
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ManageChannels,
                        ],
                    },
                    {
                        id: parent.guild.roles.everyone,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages],
                    },
                ],
            });
            return channel;
        } catch (err) {
            throw new Error(err);
        }
    }

    public static async createDirectChannel(user: User): Promise<DMChannel> {
        try {
            const channel = await user.createDM();
            return channel;
        } catch (err) {
            throw new Error(err);
        }
    }
}
