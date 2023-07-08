import { REST } from '@discordjs/rest';
import {
    APIApplicationCommand,
    RESTGetAPIApplicationCommandsResult,
    RESTPatchAPIApplicationCommandJSONBody,
    RESTPostAPIApplicationCommandsJSONBody,
    Routes,
} from 'discord.js';
import { createRequire } from 'node:module';

import { Logger } from './logger.js';
import { config } from '../config/config.js';

const require = createRequire(import.meta.url);
let Logs = require('../../lang/logs.json');

export class CommandRegistrationService {
    constructor(private rest: REST) {}

    public async process(
        localCmds: RESTPostAPIApplicationCommandsJSONBody[],
        args: string[]
    ): Promise<void> {
        let id = config.client.id;
        let remoteCmds = (await this.rest.get(
            Routes.applicationCommands(id)
        )) as RESTGetAPIApplicationCommandsResult;

        let localCmdsOnRemote = localCmds.filter(localCmd =>
            remoteCmds.some(remoteCmd => remoteCmd.name === localCmd.name)
        );
        let localCmdsOnly = localCmds.filter(
            localCmd => !remoteCmds.some(remoteCmd => remoteCmd.name === localCmd.name)
        );
        let remoteCmdsOnly = remoteCmds.filter(
            remoteCmd => !localCmds.some(localCmd => localCmd.name === remoteCmd.name)
        );

        switch (args[3]) {
            case 'view': {
                Logger.info({
                    message: Logs.info.commandActionView
                        .replaceAll(
                            '{LOCAL_AND_REMOTE_LIST}',
                            this.formatCommandList(localCmdsOnRemote)
                        )
                        .replaceAll('{LOCAL_ONLY_LIST}', this.formatCommandList(localCmdsOnly))
                        .replaceAll('{REMOTE_ONLY_LIST}', this.formatCommandList(remoteCmdsOnly)),
                });
                return;
            }
            case 'register': {
                if (localCmdsOnly.length > 0) {
                    Logger.info({
                        message: Logs.info.commandActionCreating.replaceAll(
                            '{COMMAND_LIST}',
                            this.formatCommandList(localCmdsOnly)
                        ),
                    });
                    for (let localCmd of localCmdsOnly) {
                        await this.rest.post(Routes.applicationCommands(id), {
                            body: localCmd,
                        });
                    }
                    Logger.info({
                        message: Logs.info.commandActionCreated,
                    });
                }

                if (localCmdsOnRemote.length > 0) {
                    Logger.info({
                        message: Logs.info.commandActionUpdating.replaceAll(
                            '{COMMAND_LIST}',
                            this.formatCommandList(localCmdsOnRemote)
                        ),
                    });
                    for (let localCmd of localCmdsOnRemote) {
                        this.rest.post(Routes.applicationCommands(id), {
                            body: localCmd,
                        });
                    }
                    Logger.info({
                        message: Logs.info.commandActionUpdated,
                    });
                }

                return;
            }
            case 'rename': {
                let oldName = args[4];
                let newName = args[5];
                if (!(oldName && newName)) {
                    await Logger.error({
                        message: Logs.error.commandActionRenameMissingArg,
                    });
                    return;
                }

                let remoteCmd = remoteCmds.find(remoteCmd => remoteCmd.name == oldName);
                if (!remoteCmd) {
                    await Logger.error({
                        message: Logs.error.commandActionNotFound.replaceAll(
                            '{COMMAND_NAME}',
                            oldName
                        ),
                    });
                    return;
                }

                Logger.info({
                    message: Logs.info.commandActionRenamed
                        .replaceAll('{OLD_COMMAND_NAME}', remoteCmd.name)
                        .replaceAll('{NEW_COMMAND_NAME}', newName),
                });
                let body: RESTPatchAPIApplicationCommandJSONBody = {
                    name: newName,
                };
                await this.rest.patch(Routes.applicationCommand(id, remoteCmd.id), {
                    body,
                });
                Logger.info({
                    message: Logs.info.commandActionRenamed,
                });
                return;
            }
            case 'delete': {
                let name = args[4];
                if (!name) {
                    await Logger.error({
                        message: Logs.error.commandActionDeleteMissingArg,
                    });
                    return;
                }

                let remoteCmd = remoteCmds.find(remoteCmd => remoteCmd.name == name);
                if (!remoteCmd) {
                    await Logger.error({
                        message: Logs.error.commandActionNotFound.replaceAll(
                            '{COMMAND_NAME}',
                            name
                        ),
                    });
                    return;
                }

                Logger.info({
                    message: Logs.info.commandActionDeleting.replaceAll(
                        '{COMMAND_NAME}',
                        remoteCmd.name
                    ),
                });
                await this.rest.delete(Routes.applicationCommand(id, remoteCmd.id));
                Logger.info({
                    message: Logs.info.commandActionDeleted,
                });
                return;
            }
            case 'clear': {
                Logger.info({
                    message: Logs.info.commandActionClearing.replaceAll(
                        '{COMMAND_LIST}',
                        this.formatCommandList(remoteCmds)
                    ),
                });
                await this.rest.put(Routes.applicationCommands(id), { body: [] });
                Logger.info({
                    message: Logs.info.commandActionCleared,
                });
                return;
            }
        }
    }

    private formatCommandList(
        cmds: RESTPostAPIApplicationCommandsJSONBody[] | APIApplicationCommand[]
    ): string {
        return cmds.length > 0
            ? cmds.map((cmd: { name: string }) => `'${cmd.name}'`).join(', ')
            : 'N/A';
    }
}
