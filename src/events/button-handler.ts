import { ButtonInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventHandler } from './index.js';
import { Button, ButtonDeferType } from '../buttons/index.js';
import { config } from '../config/config.js';
import { EventData } from '../models/internal-models.js';
import { EventDataService, Logger } from '../services/index.js';
import { InteractionUtils } from '../utils/index.js';

export class ButtonHandler implements EventHandler {
    private rateLimiter = new RateLimiter(
        config.rateLimiting.buttons.amount,
        config.rateLimiting.buttons.interval * 1000
    );

    constructor(private buttons: Button[], private eventDataService: EventDataService) {}

    public async process(intr: ButtonInteraction): Promise<void> {
        // Don't respond to self, or other bots
        if (intr.user.id === intr.client.user?.id) {
            return;
        }

        // Check if user is rate limited
        let limited = this.rateLimiter.take(intr.user.id);
        if (limited) {
            return;
        }

        // Try to find the button the user wants
        let button = this.findButton(intr.customId);
        if (!button) {
            return;
        }

        // Defer interaction
        // NOTE: Anything after this point we should be responding to the interaction
        switch (button.deferType) {
            case ButtonDeferType.REPLY: {
                await InteractionUtils.deferReply(intr, true);
                break;
            }
            case ButtonDeferType.UPDATE: {
                await InteractionUtils.deferUpdate(intr);
                break;
            }
        }

        // Return if defer was unsuccessful
        if (button.deferType !== ButtonDeferType.NONE && !intr.deferred) {
            return;
        }

        let eventData: EventData;
        try {
            eventData = await this.eventDataService.create({
                user: intr.user,
                channel: intr.channel,
                guild: intr.guild,
            });
        } catch (err) {
            await Logger.error({
                message: `Error creating event data for button ${intr.customId}:\n${err.message}`,
                guildId: intr.guildId,
                userId: intr.user.id,
            });
            throw err;
        }

        // Execute the button
        let passesChecks = await InteractionUtils.runChecks(button, intr);
        if (passesChecks) {
            try {
                await button.execute(intr, eventData);
            } catch (err) {
                await Logger.error({
                    message: `Error executing button ${intr.customId}:\n${err.message}`,
                    guildId: intr.guildId,
                    userId: intr.user.id,
                });
                await InteractionUtils.error(
                    intr,
                    err.reply ??
                        'An error occurred while executing this button. Please try again later.'
                );
            }
        }
    }

    private findButton(id: string): Button {
        return this.buttons.find(button => button.ids.includes(id.split('_')[0]));
    }
}
