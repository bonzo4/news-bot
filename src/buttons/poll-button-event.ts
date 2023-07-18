import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { EventData } from '../models/internal-models.js';
import { Logger } from '../services/logger.js';
import { EmbedDbUtils } from '../utils/database/embed-db-utils.js';
import { InteractionDbUtils } from '../utils/database/interaction-db-utils.js';
import { PollChoice, PollChoicesDbUtils } from '../utils/database/poll-choice-db-utils.js';
import { PollDbUtils } from '../utils/database/poll-db-utils.js';
import { InteractionUtils } from '../utils/index.js';

type Result = {
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

export function pollButtons(choices: PollChoice[]): ActionRowBuilder<ButtonBuilder>[] {
    if (choices.length < 0) return [];
    const row = new ActionRowBuilder<ButtonBuilder>();
    const randomChoices = choices.sort(() => Math.random() - 0.5);
    const pollStyle = pollStyler();
    randomChoices.forEach(choice => {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`poll_${choice.id}`)
                .setLabel(choice.text)
                .setStyle(pollStyle.next().value)
                .setEmoji(choice.emoji)
        );
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
    deferType = ButtonDeferType.REPLY;
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
                const interactionDoc = await InteractionDbUtils.getInteractionByUserIdAndPollId(
                    userData.id,
                    pollId
                );
                if (!interactionDoc) {
                    await InteractionUtils.warn(intr, 'Please vote to view the results.');
                    return;
                }
                const results = await this.getResults(pollId);

                const resultsMessage = `**Results**\n\n❓┃*Question*: ${
                    poll.question
                }\n\n${this.formateResults(results)}`;
                await InteractionUtils.success(intr, resultsMessage);
                await InteractionDbUtils.createInteraction({
                    user_id: userData.id,
                    news_id: interactionDoc.news_id,
                    guild_id: intr.guild?.id,
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
            const interactionDoc = await InteractionDbUtils.getInteractionByUserIdAndPollId(
                userData.id,
                poll.id
            );
            if (interactionDoc) {
                await InteractionUtils.warn(intr, 'You already voted.');
                await InteractionDbUtils.createInteraction({
                    user_id: userData.id,
                    news_id: interactionDoc.news_id,
                    guild_id: intr.guild?.id,
                    poll_id: poll.id,
                });
                return;
            }

            await InteractionDbUtils.createInteraction({
                user_id: userData.id,
                news_id: embed.news_id,
                poll_choice_id: choice.id,
                guild_id: intr.guildId,
                poll_id: poll.id,
            });

            const results = await this.getResults(poll.id);
            const resultsMessage = `Thank you for voting.\n\n⚫┃**Results**\n\n❓┃*Question*: ${
                poll.question
            }\n\n${this.formateResults(results)}`;

            await InteractionUtils.success(intr, resultsMessage);
        } catch (error) {
            await InteractionUtils.error(
                intr,
                `There was an error using this poll. Please contact a staff member or try again later.`
            );
            await Logger.error({
                message: `Error using quiz: ${error.message ? error.message : error}`,

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
                    text: choice.text,
                    votes: choice.votes,
                    emoji: choice.emoji,
                };
            })
            .sort((a, b) => b.votes - a.votes);
    }

    private formateResults(results: Result[]): string {
        const totalVotes = results.reduce((a, b) => a + b.votes, 0);
        let text = '';
        results.forEach(result => {
            const percentageString = `${(result.votes / totalVotes) * 100}`.split('.')[0] + '%';
            text += `${result.emoji}┃${result.text}: ${result.votes} (${percentageString})\n`;
        });
        return text + `\nTotal votes: ${totalVotes}`;
    }
}
