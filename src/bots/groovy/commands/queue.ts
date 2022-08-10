import { Message, TextChannel } from 'discord.js';
import Command from '../../../model/command';
import { players } from '../music_player';

export default class Queue extends Command {
    name = 'queue';
    aliases = ['q'];
    override requireGuild = true;
    async exec(message: Message) {
        const player = players.ensure(message.guild!, message.channel as TextChannel);
        let empty = !player || !player.songs.length;
        if (!empty) {
            message.channel.send({
                content:
                    '```' +
                    `nim\n${player?.songs
                        .map((s, i) => {
                            const title =
                                (i + 1).toString().padStart(2, ' ') +
                                ') ' +
                                s.title
                            const current = i === 0;
                            return (
                                (title.length > 38 ? title.slice(0, 37) + '…' : title.padEnd(38, ' ')) +
                                '  ' +
                                (s.isLive
                                    ? 'Live'
                                    : current
                                    ? this.hhmmss(s.durationMS - player.playtime()) + ' left'
                                    : this.hhmmss(s.durationMS))
                            );
                        })
                        .join('\n')}` +
                    '```',
                components: [
                    {
                        type: 'ACTION_ROW',
                        components: [
                            {
                                type: 'BUTTON',
                                label: 'First',
                                customId: 'queue_first',
                                style: 'SECONDARY'
                            },
                            {
                                type: 'BUTTON',
                                label: 'Back',
                                customId: 'queue_back',
                                style: 'SECONDARY'
                            },
                            {
                                type: 'BUTTON',
                                label: 'Next',
                                customId: 'queue_next',
                                style: 'SECONDARY'
                            },
                            {
                                type: 'BUTTON',
                                label: 'Last',
                                customId: 'queue_last',
                                style: 'SECONDARY'
                            },
                        ],
                    },
                ],
            });
        } else {
            message.channel.send('```nim\nThe queue is empty ;-;```');
        }
    }

    private pad(num: number) {
        return num.toFixed(0).padStart(2, '0');
    }

    private hhmmss(ms: number) {
        if (!ms) {
            return '0:00';
        }

        let seconds = ms / 1000;
        var minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        const hours = Math.floor(minutes / 60);
        minutes = minutes % 60;

        return `${hours ? this.pad(hours) + ':' : ''}${minutes ? (hours ? this.pad(minutes) : minutes) + ':' : ''}${
            minutes ? this.pad(seconds) : seconds
        }`;
    }
}
