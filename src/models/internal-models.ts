import { Locale } from 'discord.js';

import { UserDoc } from '../utils/database/user-db-utils.js';

// This class is used to store and pass data along in events
export class EventData {
    // TODO: Add any data you want to store
    constructor(
        // Event language
        public lang: Locale,
        // Guild language
        public langGuild: Locale,
        // User document
        public userData?: UserDoc | null
    ) {}
}
