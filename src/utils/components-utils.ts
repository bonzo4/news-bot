import { ActionRowBuilder, ButtonBuilder } from 'discord.js';

import { EmbedDoc } from './database/embed-db-utils.js';
import { LinkDbUtils } from './database/link-db-utils.js';
import { PollChoicesDbUtils } from './database/poll-choice-db-utils.js';
import { QuizChoicesDbUtils } from './database/quiz-choice-db-utils.js';
import { InteractionType } from './news-utils.js';
import { directButtons } from '../buttons/direct-button-event.js';
import { inputButton } from '../buttons/input-button-event.js';
import {
    linkButton,
    linkButtonForDirect,
    linkButtonForGuild,
} from '../buttons/link-button-event.js';
import { pollButtons } from '../buttons/poll-button-event.js';
import { quizButtons } from '../buttons/quiz-button-event.js';

type GetComponentsOptions = {
    embed: EmbedDoc;
    interactions: InteractionType[];
};

type GetComponentsForGuildsOptions = {
    guildId: string;
} & GetComponentsOptions;

type GetComponentsForDirectOptions = {
    userId: string;
} & GetComponentsOptions;

export class ComponentUtils {
    public static async getComponents(
        options: GetComponentsOptions
    ): Promise<ActionRowBuilder<ButtonBuilder>[]> {
        const { embed, interactions } = options;
        const components: ActionRowBuilder<ButtonBuilder>[] = [];

        for (let index = 0; index < embed.interaction_types.length; index++) {
            const interactionType = embed.interaction_types[index];
            const interaction = interactions[index];
            let component;

            switch (interactionType) {
                case 'POLL': {
                    const choices = await PollChoicesDbUtils.getChoicesByPollId(interaction.id);
                    component = pollButtons(choices);
                    break;
                }
                case 'QUIZ': {
                    const choices = await QuizChoicesDbUtils.getChoicesByQuizId(interaction.id);
                    component = quizButtons(choices);
                    break;
                }
                case 'INPUT':
                    component = [inputButton(interaction.id)];
                    break;
                case 'LINK': {
                    const link = await LinkDbUtils.getLinkById(interaction.id);
                    component = [linkButton(link)];
                    break;
                }
                case 'DIRECT':
                    component = [directButtons(interaction.id)];
                    break;
                case 'PROMO':
                    throw new Error('Promo not implemented yet.');
                // component = getPromoComponents(interaction as Promo);
            }

            if (component) {
                components.push(...component);
            }
        }

        return components;
    }

    public static async getComponentsForGuilds(
        options: GetComponentsForGuildsOptions
    ): Promise<ActionRowBuilder<ButtonBuilder>[]> {
        const { guildId, embed, interactions } = options;
        const components: ActionRowBuilder<ButtonBuilder>[] = [];

        for (let index = 0; index < embed.interaction_types.length; index++) {
            const interactionType = embed.interaction_types[index];
            const interaction = interactions[index];
            let component;

            switch (interactionType) {
                case 'POLL': {
                    const choices = await PollChoicesDbUtils.getChoicesByPollId(interaction.id);
                    component = pollButtons(choices);
                    break;
                }
                case 'QUIZ': {
                    const choices = await QuizChoicesDbUtils.getChoicesByQuizId(interaction.id);
                    component = quizButtons(choices);
                    break;
                }
                case 'INPUT':
                    component = [inputButton(interaction.id)];
                    break;
                case 'LINK': {
                    const link = await LinkDbUtils.getLinkById(interaction.id);
                    const isDiscordLink =
                        link.url.includes('discord.com') || link.url.includes('discordapp.com');
                    if (isDiscordLink) {
                        component = [linkButton(link)];
                        break;
                    }
                    component = [
                        await linkButtonForGuild({ link, newsId: embed.news_id, guildId }),
                    ];
                    break;
                }
                case 'DIRECT':
                    component = [directButtons(interaction.id)];
                    break;
                case 'PROMO':
                    throw new Error('Promo not implemented yet.');
                // component = getPromoComponents(interaction as Promo);
            }

            if (component) {
                components.push(...component);
            }
        }

        return components;
    }

    public static async getComponentsForDirect(
        options: GetComponentsForDirectOptions
    ): Promise<ActionRowBuilder<ButtonBuilder>[]> {
        const { userId, embed, interactions } = options;
        const components: ActionRowBuilder<ButtonBuilder>[] = [];

        for (let index = 0; index < embed.interaction_types.length; index++) {
            const interactionType = embed.interaction_types[index];
            const interaction = interactions[index];
            let component;

            switch (interactionType) {
                case 'POLL': {
                    const choices = await PollChoicesDbUtils.getChoicesByPollId(interaction.id);
                    component = pollButtons(choices);
                    break;
                }
                case 'QUIZ': {
                    const choices = await QuizChoicesDbUtils.getChoicesByQuizId(interaction.id);
                    component = quizButtons(choices);
                    break;
                }
                case 'INPUT':
                    component = [inputButton(interaction.id)];
                    break;
                case 'LINK': {
                    const link = await LinkDbUtils.getLinkById(interaction.id);
                    const isDiscordLink =
                        link.url.includes('discord.com') || link.url.includes('discordapp.com');
                    if (isDiscordLink) {
                        component = [linkButton(link)];
                        break;
                    }
                    component = [
                        await linkButtonForDirect({ link, newsId: embed.news_id, userId }),
                    ];
                    break;
                }
                case 'DIRECT':
                    component = [directButtons(interaction.id)];
                    break;
                case 'PROMO':
                    throw new Error('Promo not implemented yet.');
                // component = getPromoComponents(interaction as Promo);
            }

            if (component) {
                components.push(...component);
            }
        }

        return components;
    }
}
