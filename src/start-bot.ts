import { REST } from '@discordjs/rest';
import { Options, Partials } from 'discord.js';
import { createRequire } from 'node:module';

import { ApproveNewsButtons } from './buttons/approve-button-event.js';
import { ChannelButtons } from './buttons/channel-button-event.js';
import { DirectButtons } from './buttons/direct-button-event.js';
import { Button, SystemButtons } from './buttons/index.js';
import { InputButtons } from './buttons/input-button-event.js';
import { MentionButtons } from './buttons/mention-button-event.js';
import { PollButtons } from './buttons/poll-button-event.js';
import { QuizButtons } from './buttons/quiz-button-event.js';
import { SetupButtons } from './buttons/setup-button-1.js';
import { SetupChainButtons } from './buttons/setup-button-2.js';
import { SetupNewsChannelButtons } from './buttons/setup-button-3.js';
import { OtherNewsChannelButtons } from './buttons/setup-button-4.js';
import { SetupMentionButtons } from './buttons/setup-button-5.js';
import { SetupReferralButtons } from './buttons/setup-button-6.js';
import { AmbassadorCommand } from './commands/ambassador-command.js';
import { ChannelCommand } from './commands/guild/channels-command.js';
import { ReferralCommand } from './commands/guild/referral-command.js';
import { Command, SetupCommand } from './commands/index.js';
import {
    GeneralCommandMetadata,
    GuildCommandMetadata,
    NewsCommandMetadata,
} from './commands/metadata.js';
import { ApproveCommand } from './commands/news/approve-command.js';
import { DirectCommand } from './commands/news/direct-command.js';
import { NewsCommand } from './commands/news/news-command.js';
import { UnsubscribeCommand } from './commands/news/unsubscribe-command.js';
import { TrialCommand } from './commands/trial-command.js';
import { config } from './config/config.js';
import { ChannelDeleteHandler } from './events/channel-delete-handler.js';
import {
    ButtonHandler,
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from './events/index.js';
import { MenuHandler } from './events/menu-handler.js';
import { ModalSubmitHandler } from './events/modal-submit-handler.js';
import { RoleDeleteHandler } from './events/role-delete-handler.js';
import { CustomClient } from './extensions/index.js';
import { Job } from './jobs/index.js';
import { ApproveNewsMenu } from './menus/approve-menu-event.js';
import { SetupChainMenu } from './menus/chain-menu-event.js';
import { ChannelAddMenu } from './menus/channel-add-menu-event.js';
import { ChannelRemoveMenu } from './menus/channel-remove-menu-event.js';
import { MentionAddMenu } from './menus/mention-add-menu-event.js';
import { MentionRemoveMenu } from './menus/mention-remove-menu-event.js';
import { Menu } from './menus/menu.js';
import { InputModal } from './modals/input-modal-event.js';
import { ModalSubmit } from './modals/modalSubmit.js';
import { ReferralModal } from './modals/referral-modal-event.js';
import { Bot } from './models/bot.js';
import { Reaction } from './reactions/index.js';
import {
    CommandRegistrationService,
    EventDataService,
    JobService,
    Logger,
} from './services/index.js';
import { Trigger } from './triggers/index.js';

const require = createRequire(import.meta.url);
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    // Services
    let eventDataService = new EventDataService();

    // Client
    let client = new CustomClient({
        intents: config.client.intents as any,
        partials: config.client.partials.map(partial => Partials[partial]),
        makeCache: Options.cacheWithLimits({
            // Keep default caching behavior
            ...Options.DefaultMakeCacheSettings,
            // Override specific options from config
            ...config.client.caches,
        }),
        allowedMentions: {
            parse: ['users', 'roles', 'everyone'],
        },
    });

    // Commands
    let commands: Command[] = [
        new DirectCommand(),
        new UnsubscribeCommand(),
        new NewsCommand(),
        new ChannelCommand(),
        new ApproveCommand(),
        new AmbassadorCommand(),
        new TrialCommand(),
        new SetupCommand(),
        new ReferralCommand(),
    ];

    // Buttons
    let buttons: Button[] = [
        // TODO: Add new buttons here
        new SystemButtons(),
        new SetupButtons(),
        new SetupNewsChannelButtons(),
        new OtherNewsChannelButtons(),
        new SetupMentionButtons(),
        new SetupReferralButtons(),
        new ChannelButtons(),
        new MentionButtons(),
        new QuizButtons(),
        new PollButtons(),
        new InputButtons(),
        new DirectButtons(),
        new ApproveNewsButtons(),
        new SetupChainButtons(),
    ];

    let menus: Menu[] = [
        new ChannelAddMenu(),
        new MentionAddMenu(),
        new ChannelRemoveMenu(),
        new MentionRemoveMenu(),
        new ApproveNewsMenu(),
        new SetupChainMenu(),
    ];

    let modals: ModalSubmit[] = [new ReferralModal(), new InputModal()];

    // Reactions
    let reactions: Reaction[] = [
        // TODO: Add new reactions here
    ];

    // Triggers
    let triggers: Trigger[] = [
        // TODO: Add new triggers here
    ];

    // Event handlers
    let guildJoinHandler = new GuildJoinHandler();
    let guildLeaveHandler = new GuildLeaveHandler();
    let commandHandler = new CommandHandler(commands, eventDataService);
    let buttonHandler = new ButtonHandler(buttons, eventDataService);
    let menuHandler = new MenuHandler(menus, eventDataService);
    let triggerHandler = new TriggerHandler(triggers, eventDataService);
    let messageHandler = new MessageHandler(triggerHandler);
    let reactionHandler = new ReactionHandler(reactions, eventDataService);
    let channelDeleteHandler = new ChannelDeleteHandler();
    let roleDeleteHandler = new RoleDeleteHandler();
    let modalHandler = new ModalSubmitHandler(modals, eventDataService);
    // TODO: Add bot stats event and guild join event

    // Jobs
    let jobs: Job[] = [
        // TODO: Add new jobs here
    ];

    // Bot
    let bot = new Bot({
        token: config.client.token || process.env.TOKEN,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        commandHandler,
        buttonHandler,
        menuHandler,
        reactionHandler,
        channelDeleteHandler,
        modalHandler,
        roleDeleteHandler,
        jobService: new JobService(jobs),
    });

    // Register
    if (process.argv[2] == 'commands') {
        try {
            let token = config.client.token || process.env.TOKEN;
            let rest = new REST({ version: '10' }).setToken(token);
            let commandRegistrationService = new CommandRegistrationService(rest);
            let localCmds = [
                // ...Object.values(ChatCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
                // ...Object.values(MessageCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
                // ...Object.values(UserCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
                ...Object.values(NewsCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
                ...Object.values(GuildCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
                ...Object.values(GeneralCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
            ];
            await commandRegistrationService.process(localCmds, process.argv);
        } catch (error) {
            await Logger.error({
                message: Logs.error.commandAction,
                obj: error,
            });
        }
        // Wait for any final logs to be written.
        await new Promise(resolve => setTimeout(resolve, 1000));
        process.exit();
    }

    await bot.start();
}

process.on('unhandledRejection', async (reason, _promise) => {
    await Logger.error({
        message: `An unhandled promise rejection occurred.\n${reason}`,
        obj: reason,
    });
});

start().catch(async error => {
    await Logger.error({
        message: `An error occurred while starting the bot.\n${error}`,
        obj: error,
    });
});
