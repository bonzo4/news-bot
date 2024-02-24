import {
    Channel,
    CommandInteractionOptionResolver,
    Guild,
    PartialDMChannel,
    User,
} from 'discord.js';

// import { Language } from '../models/enum-helpers/language.js';
import { EventData } from '../models/internal-models.js';
import { StaffUserDbUtils } from '../utils/database/staff-user-db-utils.js';
import { UserDbUtils } from '../utils/database/user-db-utils.js';

export class EventDataService {
    public async create(
        options: {
            user?: User;
            channel?: Channel | PartialDMChannel;
            guild?: Guild;
            args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;
        } = {}
    ): Promise<EventData> {
        // TODO: Retrieve any data you want to pass along in events

        // Event language
        // let lang =
        //     options.guild?.preferredLocale &&
        //     Language.Enabled.includes(options.guild.preferredLocale)
        //         ? options.guild.preferredLocale
        //         : Language.Default;

        // // Guild language
        // let langGuild =
        //     options.guild?.preferredLocale &&
        //     Language.Enabled.includes(options.guild.preferredLocale)
        //         ? options.guild.preferredLocale
        //         : Language.Default;
        if (options.user) {
            let userData = await UserDbUtils.getUserById(options.user.id);
            if (!userData) userData = await UserDbUtils.createUser(options.user);
            const staffRole = await StaffUserDbUtils.getStaffRoleByUserId(userData.user_id);
            return new EventData(userData, staffRole);
        }
        return new EventData();
    }
}
