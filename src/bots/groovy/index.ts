import { Bot } from '../../model/bot';

export default class Groovy extends Bot {
    dirname() {
        return __dirname;
    }
    name: string = 'Groovy';
    avatarURL: string = 'https://cdn.discordapp.com/avatars/234395307759108106/0e7adc5d634d957b7725021c067bfd87.png';
    prefix: string = '-';
}
