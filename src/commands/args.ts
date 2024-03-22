import {
    APIApplicationCommandBasicOption,
    APIApplicationCommandChannelOption,
    APIApplicationCommandOption,
    APIApplicationCommandRoleOption,
    APIApplicationCommandSubcommandOption,
    ApplicationCommandOptionType,
    ChannelType,
} from 'discord.js';

export class Args {
    public static readonly CHANNEL_ADD_OPTIONS: APIApplicationCommandChannelOption = {
        name: 'add',
        description: 'Designate a channel to become a news channel.',
        type: ApplicationCommandOptionType.Channel,
        channel_types: [ChannelType.GuildText],
    };
    public static readonly CHANNEL_REMOVE_OPTIONS: APIApplicationCommandChannelOption = {
        name: 'remove',
        description: 'Designate a channel to remove from news channel.',
        type: ApplicationCommandOptionType.Channel,
        channel_types: [ChannelType.GuildText],
    };
    public static readonly CHANNEL_LIST_OPTIONS: APIApplicationCommandSubcommandOption = {
        name: 'list',
        description: 'List all news channels.',
        type: ApplicationCommandOptionType.Subcommand,
    };
    public static readonly CHANNEL_MANAGE_OPTIONS: APIApplicationCommandSubcommandOption = {
        name: 'manage',
        description: 'Manage news channels.',
        type: ApplicationCommandOptionType.Subcommand,
    };
    public static readonly MENTION_ADD_OPTIONS: APIApplicationCommandRoleOption = {
        name: 'add',
        description: 'Designate a role to be mentioned when a news article is posted.',
        type: ApplicationCommandOptionType.Role,
    };
    public static readonly MENTION_REMOVE_OPTIONS: APIApplicationCommandRoleOption = {
        name: 'remove',
        description:
            'Designate a role to remove from being mentioned when a news article is posted.',
        type: ApplicationCommandOptionType.Role,
    };
    public static readonly MENTION_LIST_OPTIONS: APIApplicationCommandOption = {
        name: 'list',
        description: 'List all roles that are mentioned when a news article is posted.',
        type: ApplicationCommandOptionType.Subcommand,
    };
    public static readonly MENTION_MANAGE_OPTIONS: APIApplicationCommandOption = {
        name: 'manage',
        description: 'Manage roles that are mentioned when a news article is posted.',
        type: ApplicationCommandOptionType.Subcommand,
    };
    public static readonly TOPIC_COMMAND: APIApplicationCommandBasicOption = {
        name: 'topic',
        description: 'The tag to display.',
        type: ApplicationCommandOptionType.String,
        required: true,
    };
}
