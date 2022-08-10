import { Message, TextChannel } from 'discord.js';
import Command from '../../../model/command';
import { players, RepeatType } from '../music_player';

export default class Loop extends Command {
    name = 'loop';
    aliases = ['repeat'];
    override requireGuild = true;
    async exec(message: Message, repeatString?: string) {
        const player = players.ensure(message.guild!, message.channel as TextChannel);
        if (player) {
            if (repeatString) {
                let type: RepeatType;
                switch (repeatString) {
                    case 'queue':
                        type = RepeatType.QUEUE;
                        break;
                    case 'current`':
                    case 'track':
                    case 'song':
                        type = RepeatType.SONG;
                        break;
                    default:
                        type = RepeatType.DISABLED;
                }
                player.toggleRepeat(type);
            } else {
                player.toggleRepeat();
            }
        }
    }
}
