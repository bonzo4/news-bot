import { ButtonInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventData } from '../models/internal-models.js';

export interface Button {
    ids: string[];
    cooldown: RateLimiter;
    deferType: ButtonDeferType;
    requireGuild?: boolean;
    requireAdmin?: boolean;
    requireSyndicatedGuild?: boolean;
    requireEmbedAuthorTag?: boolean;
    requireClientPerms?: PermissionsString[];
    execute(intr: ButtonInteraction, data: EventData): Promise<void>;
}

export enum ButtonDeferType {
    REPLY = 'REPLY',
    UPDATE = 'UPDATE',
    NONE = 'NONE',
}
