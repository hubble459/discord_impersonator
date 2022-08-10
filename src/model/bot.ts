import {
    ClientOptions,
    Collection,
    GuildChannel,
    Message,
    MessageOptions,
    MessagePayload,
    TextChannel,
    WebhookClientOptions,
    WebhookMessageOptions,
} from 'discord.js';
import { MultiBot } from '../multi_bot';
import Command from './command';
import { glob } from 'glob';
import path from 'path';

export abstract class Bot {
    readonly commands: Collection<string, Command> = new Collection();
    readonly bot: MultiBot;
    abstract dirname(): string;
    abstract name: string;
    abstract avatarURL: string;
    abstract prefix: string;
    async onMessage(message: Message, command: string, ...args: string[]): Promise<any> {
        const cmd = this.commands.get(command) || this.commands.find((c) => c.aliases?.includes(command));
        if (cmd) {
            if (!cmd.requireGuild || !!message.guild) {
                this.overrideSend(message);
                await cmd.exec(message, ...args);
            }
        }
    }
    constructor(bot: MultiBot) {
        this.bot = bot;
        this.loadCommands();
    }

    private loadCommands() {
        const commands = glob.sync(path.join(this.dirname(), 'commands', '**', '*.js'));

        for (const commandPath of commands) {
            let command = require(commandPath);
            if (command.default) {
                command = command.default;
            }
            if (command.prototype instanceof Command) {
                const cmd = new command(this) as Command;
                this.commands.set(cmd.name, cmd);
            }
        }
    }

    private overrideSend(message: Message) {
        if (message.channel instanceof GuildChannel) {
            const orgSend = message.channel.send;
            const self = this;
            message.channel.send = async function (options: string | MessagePayload | MessageOptions) {
                if (message.channel instanceof GuildChannel && !(<any>options)?.components?.length) {
                    let webhook = (await this.fetchWebhooks()).first();
                    if (!webhook) {
                        webhook = await this.createWebhook(this.id);
                    }

                    if (typeof options === 'string') {
                        options = {
                            content: options,
                        };
                    }
                    const botAccount: WebhookMessageOptions = {
                        username: self.name,
                        avatarURL: self.avatarURL,
                    };
                    if (options instanceof MessagePayload) {
                        options.options = Object.assign(options.options, botAccount);
                    } else {
                        options = Object.assign(options, botAccount);
                    }

                    return webhook.send(options);
                } else {
                    return orgSend.call(this, options);
                }
            };
        }
    }
}
