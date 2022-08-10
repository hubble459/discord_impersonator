import { Message, TextChannel } from 'discord.js';
import Command from '../../../model/command';
import { players } from '../music_player';

export default class Skip extends Command {
    name = 'skip';
    aliases = ['s'];
    override requireGuild = true;
    async exec(message: Message) {
        const player = players.ensure(message.guild!, message.channel as TextChannel);
        if (player) {
            player.skip();
        }
    }
}
