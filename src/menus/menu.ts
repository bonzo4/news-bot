import { AnySelectMenuInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventData } from '../models/internal-models.js';

export interface Menu {
    ids: string[];
    cooldown?: RateLimiter;
    deferType: MenuDeferType;
    requireGuild?: boolean;
    requireAdmin?: boolean;
    requireSyndicatedGuild?: boolean;
    requireEmbedAuthorTag?: boolean;
    requireClientPerms?: PermissionsString[];
    execute(intr: AnySelectMenuInteraction, data: EventData): Promise<void>;
}

export enum MenuDeferType {
    REPLY = 'REPLY',
    UPDATE = 'UPDATE',
    NONE = 'NONE',
}
