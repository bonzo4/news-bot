export const botSites = [
    {
        name: 'top.gg',
        enabled: false,
        url: 'https://top.gg/api/bots/1061682756209344634/stats',
        authorization: 'MTA2MTY4Mjc1NjIwOTM0NDYzNA.GqJiQn.KzHPgY3VffLcBOFdLhSGUt8KLtaqFeH8HqKuvY',
        body: '{"server_count":{{SERVER_COUNT}}}',
    },
    {
        name: 'bots.ondiscord.xyz',
        enabled: false,
        url: 'https://bots.ondiscord.xyz/bot-api/bots/1061682756209344634/guilds',
        authorization: 'MTA2MTY4Mjc1NjIwOTM0NDYzNA.GqJiQn.KzHPgY3VffLcBOFdLhSGUt8KLtaqFeH8HqKuvY',
        body: '{"guildCount":{{SERVER_COUNT}}}',
    },
    {
        name: 'discord.bots.gg',
        enabled: false,
        url: 'https://discord.bots.gg/api/v1/bots/1061682756209344634/stats',
        authorization: 'MTA2MTY4Mjc1NjIwOTM0NDYzNA.GqJiQn.KzHPgY3VffLcBOFdLhSGUt8KLtaqFeH8HqKuvY',
        body: '{"guildCount":{{SERVER_COUNT}}}',
    },
    {
        name: 'discordbotlist.com',
        enabled: false,
        url: 'https://discordbotlist.com/api/bots/1061682756209344634/stats',
        authorization:
            'Bot MTA2MTY4Mjc1NjIwOTM0NDYzNA.GqJiQn.KzHPgY3VffLcBOFdLhSGUt8KLtaqFeH8HqKuvY',
        body: '{"guilds":{{SERVER_COUNT}}}',
    },
    {
        name: 'bots.discordlabs.org',
        enabled: false,
        url: 'https://bots.discordlabs.org/v2/bot/1061682756209344634/stats',
        authorization: null,
        body: '{"token":"discordlabs.org-MTA2MTY4Mjc1NjIwOTM0NDYzNA.GqJiQn.KzHPgY3VffLcBOFdLhSGUt8KLtaqFeH8HqKuvY","server_count":"{{SERVER_COUNT}}"}',
    },
    {
        name: 'discords.com',
        enabled: false,
        url: 'https://discords.com/bots/api/bot/1061682756209344634',
        authorization: 'MTA2MTY4Mjc1NjIwOTM0NDYzNA.GqJiQn.KzHPgY3VffLcBOFdLhSGUt8KLtaqFeH8HqKuvY',
        body: '{"server_count":{{SERVER_COUNT}}}',
    },
    {
        name: 'disforge.com',
        enabled: false,
        url: 'https://disforge.com/api/botstats/1061682756209344634',
        authorization: 'MTA2MTY4Mjc1NjIwOTM0NDYzNA.GqJiQn.KzHPgY3VffLcBOFdLhSGUt8KLtaqFeH8HqKuvY',
        body: '{"servers":{{SERVER_COUNT}}}',
    },
];
