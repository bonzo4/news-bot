import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ApplicationCommandOptionChoiceData,
    AutocompleteInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    CommandInteraction,
    DiscordAPIError,
    RESTJSONErrorCodes as DiscordApiErrors,
    EmbedBuilder,
    InteractionReplyOptions,
    InteractionResponse,
    InteractionUpdateOptions,
    Message,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    WebhookMessageEditOptions,
} from 'discord.js';

import { Button } from '../buttons/button.js';
import { Command } from '../commands/index.js';
import { config } from '../config/config.js';
import { Menu } from '../menus/menu.js';
import { ModalSubmit } from '../modals/modalSubmit.js';

const IGNORED_ERRORS = [
    DiscordApiErrors.UnknownMessage,
    DiscordApiErrors.UnknownChannel,
    DiscordApiErrors.UnknownGuild,
    DiscordApiErrors.UnknownUser,
    DiscordApiErrors.UnknownInteraction,
    DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
    DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
    DiscordApiErrors.MaximumActiveThreads,
];

type MessageOptions = {
    intr:
        | ButtonInteraction
        | AnySelectMenuInteraction
        | CommandInteraction
        | MessageComponentInteraction
        | ModalSubmitInteraction;
    embed: EmbedBuilder;
    components?: ActionRowBuilder<
        ButtonBuilder | StringSelectMenuBuilder | ChannelSelectMenuBuilder | RoleSelectMenuBuilder
    >[];
};

export class InteractionUtils {
    public static async deferReply(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        hidden: boolean = false
    ): Promise<InteractionResponse> {
        try {
            return await intr.deferReply({
                ephemeral: hidden,
            });
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async deferUpdate(
        intr: MessageComponentInteraction | ModalSubmitInteraction
    ): Promise<InteractionResponse> {
        try {
            return await intr.deferUpdate();
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async send(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        content: string | EmbedBuilder | InteractionReplyOptions,
        hidden: boolean = false,
        components?: ActionRowBuilder<
            | ButtonBuilder
            | RoleSelectMenuBuilder
            | ChannelSelectMenuBuilder
            | StringSelectMenuBuilder
        >[]
    ): Promise<Message> {
        try {
            let options: InteractionReplyOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                    ? { embeds: [content] }
                    : content;
            if (intr.deferred || intr.replied) {
                return await intr.followUp({
                    ...options,
                    ephemeral: hidden,
                    components: components,
                });
            } else {
                return await intr.reply({
                    ...options,
                    ephemeral: hidden,
                    fetchReply: true,
                    components: components,
                });
            }
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async respond(
        intr: AutocompleteInteraction,
        choices: ApplicationCommandOptionChoiceData[] = []
    ): Promise<void> {
        try {
            return await intr.respond(choices);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async editReply(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        content: string | EmbedBuilder | WebhookMessageEditOptions
    ): Promise<Message> {
        try {
            let options: WebhookMessageEditOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                    ? { embeds: [content] }
                    : content;
            return await intr.editReply(options);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async update(
        intr: MessageComponentInteraction,
        content: string | EmbedBuilder | InteractionUpdateOptions
    ): Promise<Message> {
        try {
            let options: InteractionUpdateOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                    ? { embeds: [content] }
                    : content;
            return await intr.update({
                ...options,
                fetchReply: true,
            });
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async runChecks(
        event: Command | Button | Menu | ModalSubmit,
        intr:
            | ButtonInteraction
            | AnySelectMenuInteraction
            | CommandInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction
    ): Promise<boolean> {
        if (event.cooldown) {
            let limited = event.cooldown.take(intr.user.id);
            if (limited) {
                await this.warn(
                    intr,
                    `You are on cooldown for this. Please wait before trying again.`
                );
                return false;
            }
        }
        if (event.requireSyndicatedGuild && !(intr.guildId === config.syndicateGuildId)) {
            const inviteButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Join')
                .setURL(config.syndicateInvite)
                .setEmoji('⚫');
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(inviteButton);
            await this.warn(intr, `You must use this in the Syndicate Network Discord Server.`, [
                row,
            ]);
            return false;
        }
        if (event.requireGuild && !intr.guild) {
            await this.warn(intr, `You must use this in a server.`);
            return false;
        }
        if (event.requireAdmin && !intr.memberPermissions.has('Administrator')) {
            await this.warn(intr, `You must be an administrator to use this.`);
            return false;
        }
        if (event.requireGuild) {
            const clientPerms = intr.guild.roles.botRoleFor(intr.client.user).permissions;

            if (event.requireClientPerms)
                if (!clientPerms.has(event.requireClientPerms)) {
                    await this.warn(
                        intr,
                        `The bot is missing the \`${event.requireClientPerms.toString()}\` permission. Please contact a server administrator to fix this.`
                    );
                    return false;
                }
        }
        return true;
    }

    public static async reply(options: MessageOptions): Promise<Message> {
        const { intr, embed, components } = options;
        return await this.send(intr, embed, true, components);
    }

    public static async success(
        intr:
            | ButtonInteraction
            | AnySelectMenuInteraction
            | CommandInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction,
        message: string,
        components?: ActionRowBuilder<
            | ButtonBuilder
            | StringSelectMenuBuilder
            | ChannelSelectMenuBuilder
            | RoleSelectMenuBuilder
        >[]
    ): Promise<Message> {
        const embed = new EmbedBuilder()
            .setTitle('⚫ Success')
            .setDescription(`✅┃${message}`)
            .setColor(0x000000);
        return await this.send(intr, embed, true, components);
    }

    public static async warn(
        intr:
            | ButtonInteraction
            | AnySelectMenuInteraction
            | CommandInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction,
        message: string,
        components?: ActionRowBuilder<ButtonBuilder>[]
    ): Promise<Message> {
        const embed = new EmbedBuilder()
            .setTitle('⚫ Warning')
            .setDescription(`⚠️┃${message}`)
            .setColor(0xf1c232);
        return await this.send(intr, embed, true, components);
    }

    public static async error(
        intr:
            | ButtonInteraction
            | AnySelectMenuInteraction
            | CommandInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction,
        message: string,
        components?: ActionRowBuilder<ButtonBuilder>[]
    ): Promise<Message> {
        const embed = new EmbedBuilder()
            .setTitle('⚫ Error')
            .setDescription(`❌┃${message}`)
            .setColor(0xf1c232);
        return await this.send(intr, embed, true, components);
    }
}
