import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { profileButtons } from './profile-button-event.js';
import { EventData } from '../models/internal-models.js';
import { Logger } from '../services/logger.js';
import { EmbedDbUtils } from '../utils/database/embed-db-utils.js';
import { PointsDbUtils } from '../utils/database/points-db-utils.js';
import { QuizChoice, QuizChoicesDbUtils } from '../utils/database/quiz-choice-db-utils.js';
import { QuizDbUtils } from '../utils/database/quiz-db-utils.js';
import { QuizInteractionsDbUtils } from '../utils/database/quiz-interactions.db-utils.js';
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

function createRow(
    choices: QuizChoice[],
    pollStyle: Generator<ButtonStyle>
): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>();
    choices.forEach(choice => {
        const button = new ButtonBuilder()
            .setCustomId(`poll_${choice.id}`)
            .setLabel(choice.text)
            .setStyle(pollStyle.next().value);

        if (choice.emoji) button.setEmoji(choice.emoji);
        row.addComponents(button);
    });
    return row;
}

export function quizButtons(
    choices: QuizChoice[],
    randomized: boolean
): ActionRowBuilder<ButtonBuilder>[] {
    if (choices.length < 0) return [];

    const quizStyle = quizStyler();
    const randomChoices = randomized ? choices.sort(() => Math.random() - 0.5) : choices;

    const choiceRows: QuizChoice[][] = [];

    for (let i = 0; i < randomChoices.length; i += 5) {
        choiceRows.push(randomChoices.slice(i, i + 5));
    }

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];

    choiceRows.forEach(choices => {
        rows.push(createRow(choices, quizStyle));
    });

    if (rows.length % 5 === 0) {
        rows.push(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(`quiz_results_${choices[0].quiz_id}`)
                    .setLabel('Results')
                    .setStyle(ButtonStyle.Secondary)
            )
        );
    } else {
        rows[rows.length - 1].addComponents(
            new ButtonBuilder()
                .setCustomId(`quiz_results_${choices[0].quiz_id}`)
                .setLabel('Results')
                .setStyle(ButtonStyle.Secondary)
        );
    }

    return rows;
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
                const quizInteractions =
                    await QuizInteractionsDbUtils.getInteractionsByUserIdAndQuizId(
                        userData.id,
                        quizId
                    );

                const quizChoiceIds = quizInteractions.map(
                    interaction => interaction.quiz_choice_id
                );

                if (quizChoiceIds.length > 0) {
                    const embeds = intr.message.embeds;
                    const components = intr.message.components;
                    await intr.reply({
                        content: '⚠┃You have not answered yet.',
                        embeds,
                        components,
                        ephemeral: true,
                    });
                    await QuizInteractionsDbUtils.createInteraction({
                        user_id: userData.id,
                        news_id: quizInteractions[0].news_id,
                        guild_id: intr.guildId,
                        quiz_id: quizId,
                    });
                    return;
                }

                const results = await this.getResults(quizId);
                const resultsMessage = `**Results**\n\n*Question*: ${
                    quiz.question
                }\n\n💡┃*Answer*: ${quiz.answer}\n\n${this.formateResults(
                    results,
                    results.find(result => result.id === quizInteractions[0].quiz_choice_id)
                )}`;
                await InteractionUtils.success(intr, resultsMessage);

                await QuizInteractionsDbUtils.createInteraction({
                    user_id: userData.id,
                    news_id: quizInteractions[0].news_id,
                    guild_id: intr.guildId,
                    quiz_id: quizId,
                });

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

            const quizInteractions = await QuizInteractionsDbUtils.getInteractionsByUserIdAndQuizId(
                userData.id,
                quiz.id
            );

            const quizChoices = quizInteractions.filter(interaction => interaction.quiz_choice_id);

            if (quizChoices.length > 0) {
                const results = await this.getResults(quiz.id);
                const resultsMessage = `Thank you for answering\n\n**Results**\n\n*Question*: ${
                    quiz.question
                }\n\n💡┃*Answer*: ${quiz.answer}\n\n${this.formateResults(
                    results,
                    results.find(result => result.id === quizInteractions[0].quiz_choice_id)
                )}`;
                await InteractionUtils.success(intr, resultsMessage);
                await QuizInteractionsDbUtils.createInteraction({
                    user_id: userData.id,
                    news_id: embed.news_id,
                    guild_id: intr.guildId,
                    quiz_id: quiz.id,
                });

                return;
            }

            const quizInteractionDoc = await QuizInteractionsDbUtils.createInteraction({
                user_id: userData.id,
                news_id: embed.news_id,
                quiz_choice_id: choice.id,
                guild_id: intr.guildId,
                quiz_id: quiz.id,
            });

            const results = await this.getResults(quiz.id);

            let resultsMessage = `Thank you for answering\n\n**Results**\n\n*Question*: ${
                quiz.question
            }\n\n💡┃*Answer*: ${quiz.answer}\n\n${this.formateResults(
                results,
                results.find(result => result.id === choice.id)
            )}`;

            const points = await PointsDbUtils.giveQuizPoints(quizInteractionDoc);

            if (points > 0)
                resultsMessage += `\n\n🏆┃You have received **${points}** points for your answer.`;

            await InteractionUtils.success(intr, resultsMessage, [profileButtons()]);
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
            text +=
                vote === result
                    ? `✅┃${result.emoji}┃**${result.text}: ${result.votes} (${percentageString})**\n`
                    : `${this.getNumberEmoji(index)}┃${result.emoji}┃${result.text}: ${
                          result.votes
                      } (${percentageString})\n`;
        });
        return text + `\nTotal votes: ${totalVotes}`;
    }

    private getNumberEmoji(number: number): string {
        switch (number) {
            case 0:
                return '1️⃣';
            case 1:
                return '2️⃣';
            case 2:
                return '3️⃣';
            case 3:
                return '4️⃣';
            case 4:
                return '5️⃣';
        }
    }
}
