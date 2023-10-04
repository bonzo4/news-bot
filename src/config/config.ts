/* eslint-disable @typescript-eslint/no-non-null-assertion */
export const config = {
    developers: ['1010780163811856445'],
    syndicateGuildId: '980331064029495358',
    syndicateInvite: 'https://discord.gg/syndicatenetwork',
    syndicateChannels: {
        guildJoined: '1065018457441177714',
        guildCount: '1111837698559328316',
        memberCount: '1111837810740183080',
    },
    syndicateIcon:
        'https://cdn.discordapp.com/attachments/945485798873128960/1049436634187309077/syndicatelogo_1.png',
    client: {
        id: '1061682756209344634',
        token: process.env.TOKEN || '',
        intents: [
            'Guilds',
            'GuildMessages',
            'GuildMessageReactions',
            'DirectMessages',
            'DirectMessageReactions',
        ],
        partials: ['Message', 'Channel', 'Reaction'],
        caches: {
            BaseGuildEmojiManager: 0,
            GuildBanManager: 0,
            GuildInviteManager: 0,
            GuildStickerManager: 0,
            MessageManager: 0,
            PresenceManager: 0,
            StageInstanceManager: 0,
            ThreadManager: 0,
            ThreadMemberManager: 0,
            VoiceStateManager: 0,
        },
    },
    api: {
        port: 3001,
        secret: '7cd07e5276c1480d114b0b1ad748591b',
    },
    sharding: {
        spawnDelay: 5,
        spawnTimeout: 300,
        serversPerShard: 100,
    },
    clustering: {
        enabled: false,
        shardCount: 16,
        callbackUrl: 'http://localhost:3001/',
        masterApi: {
            url: 'http://localhost:5000/',
            token: '00000000-0000-0000-0000-000000000000',
        },
    },
    jobs: {
        updateServerCount: {
            schedule: '0 0 * * *',
            log: false,
        },
    },
    rateLimiting: {
        commands: {
            amount: 10,
            interval: 30,
        },
        buttons: {
            amount: 10,
            interval: 30,
        },
        menus: {
            amount: 10,
            interval: 30,
        },
        modalSubmissions: {
            amount: 10,
            interval: 30,
        },
        triggers: {
            amount: 10,
            interval: 30,
        },
        reactions: {
            amount: 10,
            interval: 30,
        },
    },
    logging: {
        pretty: true,
        rateLimit: {
            minTimeout: 30,
        },
    },
    redirectUri: 'https://wlgzgjuyqpkmnqflgkog.supabase.co/functions/v1/redirect',
    imageUrl: 'https://wlgzgjuyqpkmnqflgkog.supabase.co/functions/v1/image',
    iconUrl:
        'https://cdn.discordapp.com/attachments/945485798873128960/1049436634187309077/syndicatelogo_1.png',
    supabaseUrl: 'https://wlgzgjuyqpkmnqflgkog.supabase.co',
    supabaseKey: process.env.SUPABASE_KEY || '',
};
