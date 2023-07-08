import { Role } from 'discord.js';

import { EventHandler } from './index.js';
import { MentionDbUtils } from '../utils/index.js';

export class RoleDeleteHandler implements EventHandler {
    async process(role: Role): Promise<void> {
        const mentionRole = await MentionDbUtils.getMentionRole(role);
        if (!mentionRole) return;
        await MentionDbUtils.deleteMentionRole(role);
    }
}
