import { Message, MessageActionRow, MessageActionRowOptions, MessageEmbedOptions } from 'discord.js';
import Command from '../../../model/command';
import { NHSort, NHLanguage, NHSearchResults } from 'nhentai.js-api';
import nhentai from '../nhentai';

export default class Search extends Command {
    name = 'search';
    aliases = ['s'];
    async exec(message: Message, ...query: string[]) {
        const sortFlag = query.findIndex((q) => q.startsWith('--sort'));
        let sort: NHSort = NHSort.recent;
        if (sortFlag !== -1) {
            const split = query[sortFlag].split('=');
            sort = this.stringToSort(split[1] || query[sortFlag + 1]);
            query.splice(sortFlag, 2);
        }        

        const results = await nhentai.search(query.join(' '), sort);
        const embed = this.searchResultsToEmbed(results);
        const components = results.hentai.reduce((components, h, i) => {
            const row = Math.floor(i / 3);
            if (!components[row]) {
                components[row] = {
                    type: 1,
                    components: []
                }
            }
            const id = h.id.toString();
            components[row].components.push({
                type: 2,
                label: id,
                customId: id,
                style: 'PRIMARY',
            } as any)
            return components;
        }, [] as (MessageActionRow | MessageActionRowOptions)[]);

        console.log(components.length, components);
        
        
        message.channel.send({
            content: 'test',
            // embeds: [embed],
            components: components.slice(5)
        });
    }

    private stringToSort(sort: string): NHSort {
        return NHSort[sort as keyof typeof NHSort] || NHSort.recent;
    }

    private searchResultsToEmbed(results: NHSearchResults) {
        const embed: MessageEmbedOptions = {
            title: `Search \`${results.search}\``,
            color: 0xb00b69,
            footer: {
                text: `${results.sort} | ${results.total} result${results.total === 1 ? '' : 's'}${
                    results.total > 0 ? ` | page: ${results.page} of ${results.pages}` : ''
                }`,
            },
        };

        if (results.total > 0) {
            let list = results.hentai
                .map(
                    (hentai) =>
                        `[\`${hentai.id}\`](https://nhentai.net/g/${hentai.id}): ${this.languageToEmoji(
                            hentai.language
                        )} ${this.ellipsis(hentai.cleanTitle)}`
                )
                .join('\n');

            while (list.length > 2048) {
                list = list.slice(0, list.lastIndexOf('\n'));
            }
            embed.description = list;
        }
        return embed;
    }

    private ellipsis(text: string, length: number = 40) {
        text = text.slice(0, length);
        return text + (text.length > length ? '…' : '');
    }

    private languageToEmoji(language: NHLanguage) {
        switch (language) {
            case 'chinese':
                return '🇨🇳';
            case 'english':
                return '🇺🇸';
            default:
                return '🇯🇵';
        }
    }
}
