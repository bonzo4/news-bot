import {
    ApplicationCommandType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

// import { Args } from './index.js';

export const NewsCommandMetadata: {
    [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
    direct: {
        type: ApplicationCommandType.ChatInput,
        name: `direct`,
        name_localizations: {},
        description: 'Sign up for Syndicate Direct.',
        description_localizations: {},
        dm_permission: true,
        default_member_permissions: undefined,
        options: [],
    },
    unsubscribe: {
        type: ApplicationCommandType.ChatInput,
        name: `unsubscribe`,
        name_localizations: {},
        description: 'Unsubscribe from Syndicate Direct.',
        description_localizations: {},
        dm_permission: true,
        default_member_permissions: undefined,
        options: [],
    },
    channel: {
        type: ApplicationCommandType.ChatInput,
        name: `news`,
        name_localizations: {},
        description: 'Set the channel for news posts.',
        description_localizations: {},
        dm_permission: false,
        default_member_permissions: undefined,
        options: [],
    },
    approve: {
        type: ApplicationCommandType.ChatInput,
        name: `approve`,
        name_localizations: {},
        description: 'Approve a news article.',
        description_localizations: {},
        dm_permission: true,
        default_member_permissions: undefined,
        options: [],
    },
};

export const GuildCommandMetadata: {
    [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
    setup: {
        type: ApplicationCommandType.ChatInput,
        name: `setup`,
        name_localizations: {},
        description: 'Set up the bot for your server.',
        description_localizations: {},
        dm_permission: false,
        default_member_permissions: undefined,
        options: [],
    },
    channel: {
        type: ApplicationCommandType.ChatInput,
        name: `channel`,
        name_localizations: {},
        description: 'Set channels for news posts.',
        dm_permission: false,
        default_member_permissions: undefined,
        options: [],
    },
    mention: {
        type: ApplicationCommandType.ChatInput,
        name: `mention`,
        name_localizations: {},
        description: 'Set roles to be mentioned when a news article is posted.',
        dm_permission: false,
        default_member_permissions: undefined,
        options: [],
    },
    referral: {
        type: ApplicationCommandType.ChatInput,
        name: `referral`,
        name_localizations: {},
        description: 'Set up a referral for your server.',
        dm_permission: false,
        default_member_permissions: undefined,
    },
    premium: {
        type: ApplicationCommandType.ChatInput,
        name: `premium`,
        name_localizations: {},
        description: 'Set up a premium subscription for your server.',
        dm_permission: false,
        default_member_permissions: undefined,
    },
};

export const GeneralCommandMetadata: {
    [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
    ambassador: {
        type: ApplicationCommandType.ChatInput,
        name: `ambassador`,
        name_localizations: {},
        description: 'Become an ambassador for the Syndicate Network.',
        description_localizations: {},
        dm_permission: true,
        default_member_permissions: undefined,
        options: [],
    },
};

// export const ChatCommandMetadata: {
//     [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
// } = {
//     HELP: {
//         type: ApplicationCommandType.ChatInput,
//         name: Lang.getRef('chatCommands.help', Language.Default),
//         name_localizations: Lang.getRefLocalizationMap('chatCommands.help'),
//         description: Lang.getRef('commandDescs.help', Language.Default),
//         description_localizations: Lang.getRefLocalizationMap('commandDescs.help'),
//         dm_permission: true,
//         default_member_permissions: undefined,
//         options: [
//             {
//                 ...Args.HELP_OPTION,
//                 required: true,
//             },
//         ],
//     },
// };
