import {
    ApplicationCommandOptionChoiceData,
    AutocompleteFocusedOption,
    AutocompleteInteraction,
    CommandInteraction,
    PermissionsString,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventData } from '../models/internal-models.js';

export interface Command {
    names: string[];
    cooldown: RateLimiter;
    deferType: CommandDeferType;
    requireClientPerms?: PermissionsString[];
    requireAdmin?: boolean;
    requireGuild?: boolean;
    requireSyndicatedGuild?: boolean;
    autocomplete?(
        intr: AutocompleteInteraction,
        option: AutocompleteFocusedOption
    ): Promise<ApplicationCommandOptionChoiceData[]>;
    execute(intr: CommandInteraction, data: EventData): Promise<void>;
}

export enum CommandDeferType {
    PUBLIC = 'PUBLIC',
    HIDDEN = 'HIDDEN',
    NONE = 'NONE',
}
