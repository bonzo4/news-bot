import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { profileButtons } from './profile-button-event.js';
import { EventData } from '../models/internal-models.js';
import { Logger } from '../services/logger.js';
import { EmbedDbUtils } from '../utils/database/embed-db-utils.js';
import { PointsDbUtils } from '../utils/database/points-db-utils.js';
import { PollChoice, PollChoicesDbUtils } from '../utils/database/poll-choice-db-utils.js';
import { PollDbUtils } from '../utils/database/poll-db-utils.js';
import { PollInteractionDbUtils } from '../utils/database/poll-interaction-db-utils.js';
import { InteractionUtils } from '../utils/index.js';

type Result = {
    id: number;
    text: string;
    votes: number;
    emoji: string;
};

function* pollStyler(): Generator<ButtonStyle> {
    while (true) {
        yield ButtonStyle.Primary;
        yield ButtonStyle.Success;
        yield ButtonStyle.Danger;
    }
}

export function pollButtons(
    choices: PollChoice[],
    randomized: boolean
): ActionRowBuilder<ButtonBuilder>[] {
    if (choices.length < 0) return [];
    const row = new ActionRowBuilder<ButtonBuilder>();
    const randomChoices = randomized ? choices.sort(() => Math.random() - 0.5) : choices;
    const pollStyle = pollStyler();
    randomChoices.forEach(choice => {
        const button = new ButtonBuilder()
            .setCustomId(`poll_${choice.id}`)
            .setLabel(choice.text)
            .setStyle(pollStyle.next().value);

        if (choice.emoji) button.setEmoji(choice.emoji);
        row.addComponents(button);
    });
    if (row.components.length < 5) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`poll_results_${choices[0].poll_id}`)
                .setLabel('Results')
                .setStyle(ButtonStyle.Secondary)
        );
        return [row];
    }
    const row2 = new ActionRowBuilder<ButtonBuilder>();
    row2.addComponents(
        new ButtonBuilder()
            .setCustomId(`poll_results_${choices[0].poll_id}`)
            .setLabel('Results')
            .setStyle(ButtonStyle.Secondary)
    );
    return [row, row2];
}

export class PollButtons implements Button {
    ids: string[] = ['poll'];
    deferType = ButtonDeferType.NONE;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        try {
            const userData = data.userData;

            if (intr.customId.split('_')[1] === 'results') {
                const pollId = parseInt(intr.customId.split('_')[2]);
                const poll = await PollDbUtils.getPollById(pollId);
                if (!poll) {
                    await InteractionUtils.warn(intr, 'Invalid poll.');
                    return;
                }

                const embed = await EmbedDbUtils.getEmbedById(poll.embed_id);
                const pollInteractions =
                    await PollInteractionDbUtils.getInteractionsByUserIdAndPollId(
                        userData.id,
                        pollId
                    );
                const pollChoices = pollInteractions.filter(
                    interaction => interaction.poll_choice_id
                );
                if (pollChoices.length === 0) {
                    const embeds = intr.message.embeds;
                    const components = intr.message.components;
                    await intr.reply({
                        content: '⚠┃You have not voted yet.',
                        embeds,
                        components,
                        ephemeral: true,
                    });
                    await PollInteractionDbUtils.createInteraction({
                        user_id: userData.id,
                        news_id: embed.news_id,
                        guild_id: intr.guildId,
                        poll_id: pollId,
                    });
                    return;
                }

                const results = await this.getResults(pollId);

                const resultsMessage = `**Results**\n\n❓┃*Question*: ${
                    poll.question
                }\n\n${this.formateResults(
                    results,
                    results.find(result => result.id === pollInteractions[0].poll_choice_id)
                )}`;
                await InteractionUtils.success(intr, resultsMessage, [profileButtons()]);

                await PollInteractionDbUtils.createInteraction({
                    user_id: userData.id,
                    news_id: embed.news_id,
                    guild_id: intr.guildId,
                    poll_id: pollId,
                });
                return;
            }

            const choiceId = parseInt(intr.customId.split('_')[1]);
            const choice = await PollChoicesDbUtils.getChoiceById(choiceId);
            if (!choice) {
                await InteractionUtils.warn(intr, 'Invalid choice.');
                return;
            }
            const poll = await PollDbUtils.getPollById(choice.poll_id);
            if (!poll) {
                await InteractionUtils.warn(intr, 'Invalid poll.');
                return;
            }
            const embed = await EmbedDbUtils.getEmbedById(poll.embed_id);

            const pollInteractions = await PollInteractionDbUtils.getInteractionsByUserIdAndPollId(
                userData.id,
                poll.id
            );
            const pollChoices = pollInteractions.filter(interaction => interaction.poll_choice_id);

            if (pollChoices.length > 0) {
                const results = await this.getResults(poll.id);
                const resultsMessage = `Thank you for voting.\n\n⚫┃**Results**\n\n❓┃*Question*: ${
                    poll.question
                }\n\n${this.formateResults(
                    results,
                    results.find(result => result.id === pollInteractions[0].poll_choice_id)
                )}`;
                await InteractionUtils.success(intr, resultsMessage, [profileButtons()]);
                await PollInteractionDbUtils.createInteraction({
                    user_id: userData.id,
                    news_id: embed.news_id,
                    guild_id: intr.guildId,
                    poll_id: poll.id,
                });
                return;
            }

            const pollInteractionDoc = await PollInteractionDbUtils.createInteraction({
                user_id: userData.id,
                news_id: embed.news_id,
                poll_choice_id: choice.id,
                guild_id: intr.guildId,
                poll_id: poll.id,
            });

            const results = await this.getResults(poll.id);
            let resultsMessage = `Thank you for voting.\n\n⚫┃**Results**\n\n❓┃*Question*: ${
                poll.question
            }\n\n${this.formateResults(
                results,
                results.find(result => result.id === choice.id)
            )}`;

            const points = await PointsDbUtils.givePollPoints(pollInteractionDoc);

            if (points > 0)
                resultsMessage += `\n\n🏆┃You have received **${points}** points for your answer.`;

            await InteractionUtils.success(intr, resultsMessage, [profileButtons()]);
        } catch (error) {
            await InteractionUtils.error(
                intr,
                `There was an error using this poll. Please contact a staff member or try again later.`
            );
            await Logger.error({
                message: `Error using poll: ${error.message ? error.message : error}`,

                guildId: intr.guild ? intr.guild.id : null,
                userId: intr.user.id,
            });
        }
    }

    private async getResults(pollId: number): Promise<Result[]> {
        const choices = await PollChoicesDbUtils.getChoicesByPollId(pollId);
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
