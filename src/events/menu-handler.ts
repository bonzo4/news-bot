import { AnySelectMenuInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventHandler } from './event-handler.js';
import { config } from '../config/config.js';
import { Menu, MenuDeferType } from '../menus/index.js';
import { EventDataService } from '../services/event-data-service.js';
import { Logger } from '../services/index.js';
import { InteractionUtils } from '../utils/interaction-utils.js';

export class MenuHandler implements EventHandler {
    private rateLimiter = new RateLimiter(
        config.rateLimiting.buttons.amount,
        config.rateLimiting.buttons.interval * 1000
    );

    constructor(private menus: Menu[], private eventDataService: EventDataService) {}

    public async process(intr: AnySelectMenuInteraction): Promise<void> {
        if (intr.user.id === intr.client.user?.id || intr.user.bot) {
            return;
        }

        let limited = this.rateLimiter.take(intr.user.id);
        if (limited) {
            return;
        }

        let menu = this.findMenu(intr.customId);
        if (!menu) {
            return;
        }

        switch (menu.deferType) {
            case MenuDeferType.REPLY: {
                await InteractionUtils.deferReply(intr, true);
                break;
            }
            case MenuDeferType.UPDATE: {
                await InteractionUtils.deferUpdate(intr);
                break;
            }
        }

        if (menu.deferType !== MenuDeferType.NONE && !intr.deferred) {
            return;
        }

        let data = await this.eventDataService.create({
            user: intr.user,
            guild: intr.guild,
            channel: intr.channel,
        });
        let passesChecks = await InteractionUtils.runChecks(menu, intr);
        if (passesChecks) {
            try {
                await menu.execute(intr, data);
            } catch (err: any) {
                await InteractionUtils.error(
                    intr,
                    err.reply ??
                        'An error occurred while executing this menu. Please try again later.'
                );
                await Logger.error({
                    message: `Error executing menu ${menu.ids[0]}: ${err.message}`,
                    guildId: intr.guildId,
                    userId: intr.user.id,
                });
            }
        }
    }

    private findMenu(id: string): Menu {
        return this.menus.find(button => button.ids.includes(id.split('_')[0]));
    }
}
