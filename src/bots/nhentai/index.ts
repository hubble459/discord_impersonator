import { Bot } from '../../model/bot';

export default class NHentai extends Bot {
    dirname() {
        return __dirname;
    }
    name: string = 'NHentai';
    avatarURL: string = 'https://media.discordapp.net/attachments/751158766635843604/882981832105271296/logo.png';
    prefix: string = 'nh!';
}
