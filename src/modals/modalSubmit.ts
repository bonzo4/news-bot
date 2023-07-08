import { ModalSubmitInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventData } from '../models/internal-models.js';

export interface ModalSubmit {
    ids: string[];
    cooldown?: RateLimiter;
    deferType: ModalDeferType;
    requireGuild?: boolean;
    requireAdmin?: boolean;
    requireSyndicatedGuild?: boolean;
    requireEmbedAuthorTag?: boolean;
    requireClientPerms?: PermissionsString[];
    execute(intr: ModalSubmitInteraction, data: EventData): Promise<void>;
}

export enum ModalDeferType {
    REPLY = 'REPLY',
    UPDATE = 'UPDATE',
    NONE = 'NONE',
}
