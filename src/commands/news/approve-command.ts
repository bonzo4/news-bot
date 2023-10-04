import { CommandInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { approveNewsMenu } from '../../menus/approve-menu-event.js';
import { EventData } from '../../models/internal-models.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { Command, CommandDeferType } from '../command.js';

export class ApproveCommand implements Command {
    public names = ['approve'];
    cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.HIDDEN;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        if (data.staffRole?.staff_role !== 'ADMIN') {
            await InteractionUtils.warn(intr, 'You do not have permission to use this command.');
            return;
        }

        const menu = await approveNewsMenu();
        await InteractionUtils.success(intr, 'Select a news to approve.', [menu]);
    }
}
