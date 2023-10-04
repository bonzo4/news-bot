import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    CommandInteraction,
    NewsChannel,
    TextChannel,
    ThreadChannel,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';
import { createRequire } from 'node:module';

import { EventHandler } from './index.js';
import { Command, CommandDeferType } from '../commands/index.js';
import { config } from '../config/config.js';
import { DiscordLimits } from '../constants/index.js';
import { EventData } from '../models/internal-models.js';
import { EventDataService, Logger } from '../services/index.js';
import { CommandUtils, InteractionUtils } from '../utils/index.js';

const require = createRequire(import.meta.url);
let Logs = require('../../lang/logs.json');

export class CommandHandler implements EventHandler {
    private rateLimiter = new RateLimiter(
        config.rateLimiting.commands.amount,
        config.rateLimiting.commands.interval * 1000
    );

    constructor(public commands: Command[], private eventDataService: EventDataService) {}

    public async process(intr: CommandInteraction | AutocompleteInteraction): Promise<void> {
        // Don't respond to self, or other bots
        if (intr.user.id === intr.client.user?.id) {
            return;
        }

        let commandParts =
            intr instanceof ChatInputCommandInteraction || intr instanceof AutocompleteInteraction
                ? [
                      intr.commandName,
                      intr.options.getSubcommandGroup(false),
                      intr.options.getSubcommand(false),
                  ].filter(Boolean)
                : [intr.commandName];
        let commandName = commandParts.join(' ');

        console.log(commandParts);
        console.log(commandName);

        // Try to find the command the user wants
        let command = CommandUtils.findCommand(this.commands, commandParts);
        console.log(command);
        if (!command) {
            await Logger.error({
                message: Logs.error.commandNotFound
                    .replaceAll('{INTERACTION_ID}', intr.id)
                    .replaceAll('{COMMAND_NAME}', commandName),
                guildId: intr.guild?.id,
            });
            return;
        }

        if (intr instanceof AutocompleteInteraction) {
            if (!command.autocomplete) {
                await Logger.error({
                    message: Logs.error.autocompleteNotFound
                        .replaceAll('{INTERACTION_ID}', intr.id)
                        .replaceAll('{COMMAND_NAME}', commandName),
                    guildId: intr.guild?.id,
                });
                return;
            }

            try {
                let option = intr.options.getFocused(true);
                let choices = await command.autocomplete(intr, option);
                await InteractionUtils.respond(
                    intr,
                    choices?.slice(0, DiscordLimits.CHOICES_PER_AUTOCOMPLETE)
                );
            } catch (error) {
                await Logger.error({
                    message:
                        intr.channel instanceof TextChannel ||
                        intr.channel instanceof NewsChannel ||
                        intr.channel instanceof ThreadChannel
                            ? Logs.error.autocompleteGuild
                                  .replaceAll('{INTERACTION_ID}', intr.id)
                                  .replaceAll('{OPTION_NAME}', commandName)
                                  .replaceAll('{COMMAND_NAME}', commandName)
                                  .replaceAll('{USER_TAG}', intr.user.tag)
                                  .replaceAll('{USER_ID}', intr.user.id)
                                  .replaceAll('{CHANNEL_NAME}', intr.channel.name)
                                  .replaceAll('{CHANNEL_ID}', intr.channel.id)
                                  .replaceAll('{GUILD_NAME}', intr.guild?.name)
                                  .replaceAll('{GUILD_ID}', intr.guild?.id)
                            : Logs.error.autocompleteOther
                                  .replaceAll('{INTERACTION_ID}', intr.id)
                                  .replaceAll('{OPTION_NAME}', commandName)
                                  .replaceAll('{COMMAND_NAME}', commandName)
                                  .replaceAll('{USER_TAG}', intr.user.tag)
                                  .replaceAll('{USER_ID}', intr.user.id),
                    obj: error,
                    guildId: intr.guild?.id,
                });
            }
            return;
        }

        // Check if user is rate limited
        let limited = this.rateLimiter.take(intr.user.id);
        if (limited) {
            return;
        }

        // Defer interaction
        // NOTE: Anything after this point we should be responding to the interaction
        switch (command.deferType) {
            case CommandDeferType.PUBLIC: {
                await InteractionUtils.deferReply(intr, false);
                break;
            }
            case CommandDeferType.HIDDEN: {
                await InteractionUtils.deferReply(intr, true);
                break;
            }
        }

        // Return if defer was unsuccessful
        if (command.deferType !== CommandDeferType.NONE && !intr.deferred) {
            return;
        }

        let eventData: EventData;
        try {
            eventData = await this.eventDataService.create({
                user: intr.user,
                channel: intr.channel,
                guild: intr.guild,
            });
        } catch (err) {
            await Logger.error({
                message: `Error creating event data for button ${intr.commandName}:\n${err.message}`,
                guildId: intr.guildId,
                userId: intr.user.id,
            });
            throw err;
        }

        let passesChecks = await InteractionUtils.runChecks(command, intr);
        if (passesChecks) {
            try {
                await command.execute(intr, eventData);
            } catch (error) {
                await InteractionUtils.error(
                    intr,
                    error.reply ??
                        'An error occurred while executing this command. Please try again later.'
                );
                await Logger.error({
                    message: `Error executing command ${command.names}: ${error.message}`,
                    guildId: intr.guildId,
                    userId: intr.user.id,
                });
            }
        }
    }
}
