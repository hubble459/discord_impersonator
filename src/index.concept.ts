import { Client, Intents, Message, TextChannel, Webhook } from 'discord.js';

type JSONDB = {
    [userId: string]: {
        prefix: string;
        avatar: string;
        username: string;
    };
};

const prefixes: JSONDB = {};

class CaptainHook extends Client {
    constructor() {
        super({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.GUILD_INTEGRATIONS,
                Intents.FLAGS.GUILD_WEBHOOKS,
            ],
        });
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

    async handleSettings(message: Message) {
        const config = prefixes[message.author.id];
        const args = message.content.split(/ +/).slice(1);
        switch (args[0]) {
            case undefined:
            case 'help':
                await message.channel.send('Help here');
                return;
            case 'prefix':
                if (args[1]) {
                    config.prefix = args[1];
                    await message.channel.send(`Prefix changed to ${config.prefix}`);
                } else {
                    await message.channel.send('Missing prefix');
                }
                break;
            case 'username':
            case 'nickname':
                if (args[1] && args[1].length < 32) {
                    config.username = args[1];
                    await message.channel.send(`Username changed to ${config.username}`);
                } else {
                    await message.channel.send('Missing username');
                }
                break;
            case 'avatar':
                if (args[1]) {
                    config.avatar = args[1];
                    await message.channel.send('Avatar changed');
                } else {
                    await message.channel.send('Missing url');
                }
        }
    }

    async onMessage(message: Message) {
        if (message.guild && !message.author.bot) {
            // if (message.guild && message.guild.id === '372048803827548170' && !message.author.bot) {
            if (message.channel instanceof TextChannel) {
                const config = (prefixes[message.author.id] = prefixes[message.author.id] || {
                    avatar:
                        message.author.avatarURL() ||
                        'https://i.pinimg.com/736x/7b/5a/52/7b5a5268797641806d442e211bcabdab.jpg',
                    username: message.member?.nickname || message.author.username,
                    prefix: '>>',
                });

                if (message.content.startsWith(`<@!${this.user?.id}>`)) {
                    return this.handleSettings(message);
                } else if (message.content.startsWith('-')) {
                    let webhook = (await message.channel.fetchWebhooks()).first();
                    if (!webhook) {
                        webhook = await message.channel.createWebhook(message.channelId);
                    }

                    if (message.content.startsWith('-np')) {
                        return webhook.send({
                            username: 'Groovy',
                            avatarURL:
                                'https://cdn.discordapp.com/avatars/234395307759108106/0e7adc5d634d957b7725021c067bfd87.png',
                            embeds: [
                                {
                                    color: 15335205,
                                    description: `[Groovy dying sounds](https://www.youtube.com/watch?v=dQw4w9WgXcQ) [<@${message.author.id}>]`,
                                    footer: { text: '▬▬🔵▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ 18s / 2m 27s' },
                                },
                            ],
                            files: Array.from(message.attachments.values()),
                            components: message.components,
                        });
                    } else if (message.content.startsWith('-play')) {
                        return webhook.send({
                            username: 'Groovy',
                            avatarURL:
                                'https://cdn.discordapp.com/avatars/234395307759108106/0e7adc5d634d957b7725021c067bfd87.png',
                            embeds: [
                                {
                                    color: 15335205,
                                    description: `Queued [${message.content.replace(/^-\w+ +/, '')}](https://www.youtube.com/watch?v=dQw4w9WgXcQ) [<@${message.author.id}>]`,
                                },
                            ],
                            files: Array.from(message.attachments.values()),
                            components: message.components,
                        });
                    }
                } else if (message.content.startsWith(config.prefix)) {
                    let webhook: Webhook | undefined;
                    const hooks = await message.channel.fetchWebhooks();
                    webhook = hooks.first();
                    if (!webhook) {
                        webhook = await message.channel.createWebhook(message.channelId);
                    }

                    return webhook.send({
                        username: config.username,
                        avatarURL: config.avatar,
                        content: message.content.replace(new RegExp(`^${config.prefix} *`), '') || '⠀',
                        embeds: message.embeds,
                        files: Array.from(message.attachments.values()),
                        components: message.components,
                    });
                }
            }
        }
    }
}

new CaptainHook().login(process.env.TOKEN!).then(() => {
    console.log('logged in');
});
