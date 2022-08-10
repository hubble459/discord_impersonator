import { MessageOptions, MessagePayload, TextChannel, WebhookMessageOptions } from 'discord.js';
import { APIMessage } from 'discord-api-types';

declare module 'discord.js' {
    interface TextBasedChannelFields {
        send(options: string | MessagePayload | MessageOptions): Promise<Message | APIMessage>;
    }
}

// const sendOrg = TextChannel.prototype.send;
// TextChannel.prototype.send = async function (options: string | MessagePayload | MessageOptions) {
//     let webhook = (await this.fetchWebhooks()).first();
//     if (!webhook) {
//         webhook = await this.createWebhook(this.id);
//     }

//     if (typeof options === 'string') {
//         options = {
//             content: options,
//         };
//     }
//     if (options instanceof MessagePayload) {
//         options.options = Object.assign(options.options, {
//             username: 'test',
//             avatarURL: 'https://cdn.discordapp.com/avatars/321290073335136256/a_590345053fdd0fe119885cde2b041f71.gif?size=1024',
//         } as MessageOptions);
//     } else {
//         options = Object.assign(options, {
//             username: 'test',
//             avatarURL: 'https://cdn.discordapp.com/avatars/321290073335136256/a_590345053fdd0fe119885cde2b041f71.gif?size=1024',
//         } as MessageOptions);
//     }

//     return webhook.send(options);
// };
