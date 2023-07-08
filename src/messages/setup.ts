import { EmbedBuilder } from 'discord.js';

import { config } from '../config/config.js';

export class SetupMessages {
    public static setupStart(welcomeBanner: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle('⚫ㅤSyndicate Setup')
            .setImage(welcomeBanner)
            .setDescription('❓┃Would you like to set up the Syndicate Bot Now?')
            .setColor('NotQuiteBlack')
            .setFooter({
                text: 'Powered by Syndicate',
                iconURL: config.iconUrl,
            })
            .setTimestamp();
    }

    public static newsChannel(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle('⚫ㅤSyndicate Setup')
            .setDescription(`📰┃Would you like the bot to create a Syndicate News Channel?`)
            .setColor('NotQuiteBlack')
            .setFooter({
                text: 'Powered by Syndicate',
                iconURL: config.iconUrl,
            })
            .setTimestamp();
    }

    public static otherNewsChannel(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle('⚫ㅤSyndicate Setup')
            .setDescription(
                `🔊┃Would you like to designate another channel as a Syndicate News Channel?`
            )
            .setColor('NotQuiteBlack')
            .setFooter({
                text: 'Powered by Syndicate',
                iconURL: config.iconUrl,
            })
            .setTimestamp();
    }

    public static pingRole(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle('⚫ㅤSyndicate Setup')
            .setDescription(`📢┃Please designate a role to be pinged when the news gets sent out.`)
            .setColor('NotQuiteBlack')
            .setFooter({
                text: 'Powered by Syndicate',
                iconURL: config.iconUrl,
            })
            .setTimestamp();
    }

    public static referral(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle('⚫ㅤSyndicate Setup')
            .setDescription(
                `⭐┃Did a Syndicate Ambassador refer you this this bot? If so please enter the referral code below.`
            )
            .setColor('NotQuiteBlack')
            .setFooter({
                text: 'Powered by Syndicate',
                iconURL: config.iconUrl,
            })
            .setTimestamp();
    }

    public static chain(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle('⚫ㅤSyndicate Setup')
            .setDescription(
                `🔗┃What chain would you like to receive news on? Please select one of the options below.`
            )
            .setColor('NotQuiteBlack')
            .setFooter({
                text: 'Powered by Syndicate',
                iconURL: config.iconUrl,
            })
            .setTimestamp();
    }

    public static systemMessage(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle('⚫ㅤSyndicate Network')
            .setDescription(
                `Welcome to Syndicate! The premiere web3 news bot for Discord.
            \nWe provide your server with daily news and insights on stocks, crypto, and NFTs, for free.
            \nThis is the Syndicate System channel. This channel is used to send system messages to Syndicate. **Please do not delete this channel.**
            \nClick the **"News"** button below to begin the set-up of our bot.`
            )
            .addFields([
                {
                    name: 'Extra Commands',
                    value: `> **/ping** - designate up to 3 roles to be pinged when the news gets sent out
                > **/channels** - setup news for a different channel`,
                },
                {
                    name: 'Syndicate Discord:',
                    value: '> https://discord.gg/QZDFwWqr9F',
                },
                {
                    name: 'Syndicate Twitter:',
                    value: '> https://twitter.com/SyndicateCREATE',
                },
                {
                    name: 'Syndicate Website:',
                    value: '> https://www.syndicatenetwork.io/',
                },
            ])
            .setFooter({
                text: 'Powered by Syndicate',
                iconURL: config.iconUrl,
            })
            .setTimestamp();
    }

    public static helpMessage(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle('❓┃Help')
            .setTimestamp()
            .setDescription(
                `⚫┃Thank you for adding the Syndicate Bot to your server
                    > How to use the bot: `
            )
            .addFields([
                {
                    name: '⚙┃Setup',
                    value: `> Run **/setup** to setup the bot in your server. This will create a category and system channel for the bot to use.
                        \n> You will need to have the base following permissions for the bot: 
                        > **View Channels**, **Manage Channels**, **Manage Roles**, **Send Messages**, **Embed Links**, and **External Emojis**.`,
                },
                {
                    name: '📰┃News',
                    value: `> Run **/news** to setup the news channel in your server. This will create a news channel for the bot to use.
                        \n> This will require the same permissions as the **/setup** command.`,
                },
                {
                    name: '🔊┃Channels',
                    value: `> Run **/channels** to manage the channels the bot can send news to.
                        \n> The bot will need these permissions to the channel: 
                        > **View Channel**, **Send Messages**, **Embed Links**, and **External Emojis**.`,
                },
                {
                    name: '📣┃Pings',
                    value: `> Run **/pings** to manage the roles the bot will ping when news is sent out.
                        > The bot will need the **Mention Roles** permission.`,
                },
                {
                    name: '❓┃Need more help?',
                    value: `> Contact **hvSocrates | tD#5104** for any other questions.`,
                },
            ]);
    }
}
