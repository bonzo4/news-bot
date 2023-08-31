import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { EventData } from '../models/internal-models.js';
import { Logger } from '../services/logger.js';
import { EmbedDbUtils } from '../utils/database/embed-db-utils.js';
import { InteractionDbUtils } from '../utils/database/interaction-db-utils.js';
import { QuizChoice, QuizChoicesDbUtils } from '../utils/database/quiz-choice-db-utils.js';
import { QuizDbUtils } from '../utils/database/quiz-db-utils.js';
import { InteractionUtils } from '../utils/index.js';

type Result = {
    id: number;
    text: string;
    votes: number;
    emoji: string;
};

function* quizStyler(): Generator<ButtonStyle> {
    while (true) {
        yield ButtonStyle.Primary;
        yield ButtonStyle.Success;
        yield ButtonStyle.Danger;
    }
}

export function quizButtons(choices: QuizChoice[], randomized: boolean): ActionRowBuilder<ButtonBuilder>[] {
    if (choices.length < 0) return [];
    const row = new ActionRowBuilder<ButtonBuilder>();
    const randomChoices = randomized
        ? choices.sort(() => Math.random() - 0.5)
        : choices;
    const quizStyle = quizStyler();
    randomChoices.forEach(choice => {
        const button = new ButtonBuilder()
            .setCustomId(`quiz_${choice.id}`)
            .setLabel(choice.text)
            .setStyle(quizStyle.next().value);

        if (choice.emoji) button.setEmoji(choice.emoji);
        row.addComponents(button);
    });
    if (row.components.length < 5) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`quiz_results_${choices[0].quiz_id}`)
                .setLabel('Results')
                .setStyle(ButtonStyle.Secondary)
        );
        return [row];
    }
    const row2 = new ActionRowBuilder<ButtonBuilder>();
    row2.addComponents(
        new ButtonBuilder()
            .setCustomId(`quiz_results_${choices[0].quiz_id}`)
            .setLabel('Results')
            .setStyle(ButtonStyle.Secondary)
    );
    return [row, row2];
}

export class QuizButtons implements Button {
    ids: string[] = ['quiz'];
    deferType = ButtonDeferType.NONE;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        try {
            const userData = data.userData;

            if (intr.customId.split('_')[1] === 'results') {
                const quizId = parseInt(intr.customId.split('_')[2]);
                const quiz = await QuizDbUtils.getQuizById(quizId);
                if (!quiz) {
                    await InteractionUtils.warn(intr, 'Invalid quiz.');
                    return;
                }
                const interactionDoc = await InteractionDbUtils.getInteractionByUserIdAndQuizId(
                    userData.id,
                    quizId
                );
                if (!interactionDoc) {
                    const embeds = intr.message.embeds
                    const components = intr.message.components
                    await intr.reply({
                        content: '⚠┃You have not answered yet.',
                        embeds,
                        components,
                        ephemeral: true
                    })
                    return;
                }
                const results = await this.getResults(quizId);
                const resultsMessage = `**Results**\n\n*Question*: ${
                    quiz.question
                    }\n\n💡┃*Answer*: ${quiz.answer}\n\n${this.formateResults(results, results.find(result => result.id === interactionDoc.quiz_choice_id))}`;
                await InteractionUtils.success(intr, resultsMessage);
                // await InteractionDbUtils.createInteraction({
                //     user_id: userData.id,
                //     news_id: interactionDoc.news_id,
                //     guild_id: intr.guild?.id,
                //     quiz_id: quizId,
                // });
                return;
            }

            const choiceId = parseInt(intr.customId.split('_')[1]);
            const choice = await QuizChoicesDbUtils.getChoiceById(choiceId);
            if (!choice) {
                await InteractionUtils.warn(intr, 'Invalid choice.');
                return;
            }
            const quiz = await QuizDbUtils.getQuizById(choice.quiz_id);
            if (!quiz) {
                await InteractionUtils.warn(intr, 'Invalid quiz.');
                return;
            }
            const embed = await EmbedDbUtils.getEmbedById(quiz.embed_id);
            const interactionDoc = await InteractionDbUtils.getInteractionByUserIdAndQuizId(
                userData.id,
                quiz.id
            );
            if (interactionDoc) {
                const results = await this.getResults(quiz.id);
                const resultsMessage = `**Results**\n\n*Question*: ${quiz.question
                    }\n\n💡┃*Answer*: ${quiz.answer}\n\n${this.formateResults(results, results.find(result => result.id === interactionDoc.quiz_choice_id))}`;
                await InteractionUtils.success(intr, resultsMessage);
                // await InteractionDbUtils.createInteraction({
                //     user_id: userData.id,
                //     news_id: interactionDoc.news_id,
                //     guild_id: intr.guild?.id,
                //     quiz_id: quiz.id,
                // });
                return;
            }
            await InteractionDbUtils.createInteraction({
                user_id: userData.id,
                news_id: embed.news_id,
                quiz_choice_id: choice.id,
                guild_id: intr.guildId,
                quiz_id: quiz.id,
            });

            const results = await this.getResults(quiz.id);

            const resultsMessage = `Thank you for voting.\n\n**⚫┃Results**\n\n❓┃*Question*: ${
                quiz.question
            }\n\n💡┃*Answer*: ${quiz.answer}\n\n${this.formateResults(results, results.find(result => result.id === choice.id))}`;

            await InteractionUtils.success(intr, resultsMessage);
        } catch (error) {
            await InteractionUtils.error(
                intr,
                `There was an error using this quiz. Please contact a staff member or try again later.`
            );
            await Logger.error({
                message: `Error using quiz: ${error.message ? error.message : error}`,
                guildId: intr.guild ? intr.guild.id : null,
                userId: intr.user.id,
            });
        }
    }

    private async getResults(quizId: number): Promise<Result[]> {
        const choices = await QuizChoicesDbUtils.getChoicesByQuizId(quizId);
        return choices
            .map(choice => {
                return {
                    id: choice.id,
                    text: choice.text,
                    votes: choice.votes,
                    emoji: choice.emoji,
                };
            })
            .sort((a, b) => b.votes - a.votes);
    }

    private formateResults(results: Result[], vote: Result): string {
        const totalVotes = results.reduce((a, b) => a + b.votes, 0);
        let text = '';
        results.forEach((result, index) => {
            const percentageString = `${(result.votes / totalVotes) * 100}`.split('.')[0] + '%';
            text += vote === result
                ? `✅┃${result.emoji}┃**${result.text}: ${result.votes} (${percentageString})**\n` 
                : `${this.getNumberEmoji(index)}┃${result.emoji}┃${result.text}: ${result.votes} (${percentageString})\n`;
        });
        return text + `\nTotal votes: ${totalVotes}`;
    }

    private getNumberEmoji(number: number): string {
        switch (number) {
            case 0: return '1️⃣';
            case 1: return '2️⃣';
            case 2: return '3️⃣';
            case 3: return '4️⃣';
            case 4: return '5️⃣';
        }
    }
}
