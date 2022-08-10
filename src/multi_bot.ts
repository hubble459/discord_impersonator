import { Client, Intents, Message } from 'discord.js';
import { glob } from 'glob';
import path from 'path';
import { Bot } from './model/bot';
import './discord.js.overrides';

export class MultiBot extends Client<true> {
    readonly bots: Bot[] = [];

    constructor() {
        super({
            intents: [
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_INTEGRATIONS,
                Intents.FLAGS.GUILD_WEBHOOKS,
                Intents.FLAGS.GUILD_VOICE_STATES,
            ],
        });
        this.loadBots();
        this.on('messageCreate', this.errorHandler(this.onMessage));
    }

    errorHandler(fun: (...args: any[]) => any) {
        return async (...args: any[]) => {
            try {
                await fun.call(this, ...args);
            } catch (e) {
                console.error(e);
            }
        };
    }

    loadBots() {
        const bots = glob.sync(path.join(__dirname, 'bots', '**', '*.js'));
        for (const botPath of bots) {
            let bot = require(botPath);
            if (bot.default) {
                bot = bot.default;
            }
            if (bot.prototype instanceof Bot) {
                this.bots.push(new bot(this));
            }
        }
    }

    async onMessage(message: Message) {
        if (!message.author.bot) {
            const args = message.content.split(/[ \n\r\t]+/);
            const prefix = args.shift()!;
            const bots = this.bots.filter((bot) => prefix.startsWith(bot.prefix));
            const promises: Promise<any>[] = [];
            for (const bot of bots) {
                if (bot.onMessage) {
                    if (prefix !== bot.prefix) {
                        args.unshift(prefix.slice(bot.prefix.length));
                    }
                    promises.push(bot.onMessage(message, args[0], ...args.slice(1)));
                }
            }
            await Promise.all(promises);
        }
    }
}
