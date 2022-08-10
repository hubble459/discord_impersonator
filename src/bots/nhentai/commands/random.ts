import { EmbedField, Message } from 'discord.js';
import { NHTag } from 'nhentai.js-api';
import Command from '../../../model/command';
import nhentai from '../nhentai';

export default class Random extends Command {
    name = 'random';
    aliases = ['r'];
    async exec(message: Message, language?: string) {
        const h = await nhentai.random(!language || !/eng(lish)?/.test(language));
        message.channel.send({
            embeds: [
                {
                    title: h.cleanTitle,
                    url: h.url,
                    thumbnail: { url: h.cover },
                    color: 11537257,
                    fields: Object.entries(h.tags)
                        .filter(([, arr]) => !!arr.length)
                        .map(
                            ([name, value]): EmbedField => ({
                                inline: false,
                                name,
                                value: this.tagArrayToCodeParts(value),
                            })
                        ),
                },
            ],
        });
    }

    private tagArrayToCodeParts(arr: NHTag[]) {
        const blocks = arr.map((t) => `[\`${t.name.replace('|', '-')}\`](${t.url})\`${t.amountString}\``);

        const size = blocks.reduce((size, tag) => (size += tag.length + 1), 0);
        if (size > 1024) {
            for (let i = blocks.length - 1; i >= 0; i--) {
                blocks[i] = '`' + arr[i].name + ' ' + arr[i].amountString + '`';
                if (blocks.reduce((size, tag) => (size += tag.length + 1), 0) <= 1024) {
                    break;
                }
            }
        }

        return blocks.join(' ');
    }
}
