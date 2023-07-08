import {
    Guild,
    GuildInvitableChannelResolvable,
    PermissionFlagsBits,
    TextChannel,
} from 'discord.js';

export class GuildUtils {
    public static async checkPerms(guild: Guild): Promise<boolean> {
        const clientPerms = guild.roles.botRoleFor(guild.client.user).permissions;
        if (!clientPerms.has(PermissionFlagsBits.ViewChannel)) return false;
        if (!clientPerms.has(PermissionFlagsBits.ManageChannels)) return false;
        if (!clientPerms.has(PermissionFlagsBits.ManageRoles)) return false;
        if (!clientPerms.has(PermissionFlagsBits.SendMessages)) return false;
        if (!clientPerms.has(PermissionFlagsBits.EmbedLinks)) return false;
        if (!clientPerms.has(PermissionFlagsBits.UseExternalEmojis)) return false;
        return true;
    }

    public static async getInvite(guild: Guild): Promise<string | null> {
        try {
            let inviteString: string | null = null;
            const invite = guild.invites.cache.find(invite => {
                if (invite.maxAge === 0 && invite.maxUses === 0) return invite;
            });
            if (invite) inviteString = invite.url;
            else {
                const channel = guild.channels.cache.find(
                    channel =>
                        channel
                            .permissionsFor(guild.members.me)
                            .has(PermissionFlagsBits.ViewChannel) &&
                        channel
                            .permissionsFor(guild.members.me)
                            .has(PermissionFlagsBits.CreateInstantInvite)
                ) as GuildInvitableChannelResolvable;
                if (channel) {
                    const invite = await guild.invites.create(channel);
                    inviteString = invite.url;
                }
            }
            return inviteString;
        } catch (error) {
            return null;
        }
    }

    public static async findAnnouncementChannel(guild: Guild): Promise<TextChannel | null> {
        const channel = guild.channels.cache.find(channel => {
            if (channel.name === 'announcements') return channel;
            if (channel.name.includes('announcements')) return channel;
            if (channel.name.includes('announce')) return channel;
        }) as TextChannel;
        return channel;
    }
}
