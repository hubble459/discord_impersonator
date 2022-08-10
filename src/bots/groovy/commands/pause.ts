import { Message, TextChannel } from 'discord.js';
import Command from '../../../model/command';
import { players } from '../music_player';

export default class Pause extends Command {
    name = 'pause';
    aliases = [];
    override requireGuild = true;
    async exec(message: Message) {
        const player = players.ensure(message.guild!, message.channel as TextChannel);
        if (player && player.pause()) {
            message.channel.send({
                embeds: [
                    {
                        description: '▶️ Paused the player',
                        color: 15335205
                    },
                ],
            });
        }
    }
}
