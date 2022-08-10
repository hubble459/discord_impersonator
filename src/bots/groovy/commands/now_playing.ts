import { Message, TextChannel } from 'discord.js';
import Command from '../../../model/command';
import { players } from '../music_player';

export default class NowPlaying extends Command {
    name = 'nowplaying';
    aliases = ['now', 'np', 'current', 'playing'];
    override requireGuild = true;
    async exec(message: Message) {
        const player = players.ensure(message.guild!, message.channel as TextChannel);

        if (player) {
            const song = player.songs[0];

            if (player.audio && song) {
                const prog = '▬'.repeat(19).split('');
                prog.splice(Math.floor((20 / song.durationMS) * player.audio.playbackDuration), 0, '🔵');
                message.channel.send({
                    embeds: [
                        {
                            description: `[${song.title}](${song.url}) [<@${song.requestor.id}>]`,
                            footer: {
                                text:
                                    prog.join('') + ' ' + this.duration(song.durationMS, player.audio.playbackDuration),
                            },
                            color: 15335205,
                        },
                    ],
                });
            } else {
                player.error('You must be playing a track to use this command!');
            }
        }
    }

    duration(total: number, played: number) {
        return `${this.durationFromMS(played)} / ${this.durationFromMS(total)}`;
    }

    durationFromMS(ms: number) {
        let secs = Math.floor(ms / 1000);
        let mins = Math.floor(secs / 60);
        const hours = Math.floor((mins / 60) % 60);
        secs %= 60;
        mins %= 60;

        let s = `${secs}s`;
        if (!!mins) {
            s = `${mins}m ` + s;
        }
        if (!!hours) {
            s = `${hours}h ` + s;
        }

        return s;
    }
}
