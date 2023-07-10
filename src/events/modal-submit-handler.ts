import { ModalSubmitInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventHandler } from './index.js';
import { config } from '../config/config.js';
import { ModalDeferType, ModalSubmit } from '../modals/modalSubmit.js';
import { EventDataService } from '../services/event-data-service.js';
import { Logger } from '../services/logger.js';
import { InteractionUtils } from '../utils/index.js';

export class ModalSubmitHandler implements EventHandler {
    private rateLimiter = new RateLimiter(
        config.rateLimiting.modalSubmissions.amount,
        config.rateLimiting.modalSubmissions.interval
    );

    constructor(private modalSubmits: ModalSubmit[], private eventDataService: EventDataService) {}

    public async process(intr: ModalSubmitInteraction): Promise<void> {
        // Don't respond to self, or other bots
        if (intr.user.id === intr.client.user?.id) {
            return;
        }

        // Check if user is rate limited
        let limited = this.rateLimiter.take(intr.user.id);
        if (limited) {
            return;
        }

        let modal = this.findModal(intr.customId);
        if (!modal) {
            return;
        }

        // Defer interaction
        // NOTE: Anything after this point we should be responding to the interaction
        switch (modal.deferType) {
            case ModalDeferType.REPLY: {
                await InteractionUtils.deferReply(intr, true);
                break;
            }
            case ModalDeferType.UPDATE: {
                await InteractionUtils.deferUpdate(intr);
                break;
            }
        }

        // Return if defer was unsuccessful
        if (modal.deferType !== ModalDeferType.NONE && !intr.deferred) {
            return;
        }

        // Get data from database
        let data = await this.eventDataService.create({
            user: intr.user,
            channel: intr.channel,
            guild: intr.guild,
        });

        // Execute the modal
        let passesChecks = await InteractionUtils.runChecks(modal, intr);
        if (passesChecks) {
            try {
                await modal.execute(intr, data);
            } catch (err) {
                await InteractionUtils.error(
                    intr,
                    err.reply ??
                        'An error occurred while executing this modal. Please try again later.'
                );
                await Logger.error({
                    message: `Error executing modal ${modal.ids[0]}: ${err.message}`,
                    guildId: intr.guildId,
                    userId: intr.user.id,
                });
            }
        }
    }

    private findModal(id: string): ModalSubmit {
        return this.modalSubmits.find(modal => modal.ids.includes(id.split('_')[0]));
    }
}
