import { StaffUser } from '../utils/database/staff-user-db-utils.js';
import { UserDoc } from '../utils/database/user-db-utils.js';

// This class is used to store and pass data along in events
export class EventData {
    // TODO: Add any data you want to store
    constructor(
        // User document
        public userData?: UserDoc | null,
        // Staff document
        public staffRole?: StaffUser | null
    ) {}
}
