import { EmbedBuilder } from 'discord.js';

import { config } from '../config/config.js';

interface SystemMessageOptions {
    guildId: string;
    welcomeBanner: string;
}

export function* systemMessages(options: SystemMessageOptions): Generator<EmbedBuilder[]> {
    const { welcomeBanner } = options;
    yield [
        new EmbedBuilder().setTitle('Welcome to Syndicate!').setImage(welcomeBanner),
        new EmbedBuilder()
            .setTitle('Setup')
            .setDescription('Would you like to setup the Syndicate Bot?'),
    ];
}

export function cancelMessage(): EmbedBuilder[] {
    return [
        new EmbedBuilder()
            .setTitle('Setup Cancelled')
            .setDescription(
                'The setup process has been cancelled. Please run **/setup** again to restart the process.'
            ),
    ];
}

export function referralMessage(): EmbedBuilder[] {
    return [
        new EmbedBuilder()
            .setTitle('Referral Code')
            .setDescription(
                'Please enter Syndicate Affiliate Referral Code if you have one below.'
            ),
    ];
}

export function newsMessage(): EmbedBuilder[] {
    return [
        new EmbedBuilder()
            .setTitle('News')
            .setDescription('Would you like to add a Syndicate news channel to your server?'),
    ];
}

export function channelMessage(): EmbedBuilder[] {
    return [
        new EmbedBuilder()
            .setTitle('News Channel')
            .setDescription(
                'You can also add a channel to receive news in. Would you like to do that now?'
            ),
    ];
}

export function mentionMessage(): EmbedBuilder[] {
    return [
        new EmbedBuilder()
            .setTitle('Mention')
            .setDescription(
                'Would you like to designate a role to be pinged when the news gets sent out?'
            ),
    ];
}

export function systemMessage(): EmbedBuilder[] {
    const systemMessage = new EmbedBuilder()
        .setTitle('📰ㅤSyndicate News')
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
        });
    return [systemMessage];
}
