import { Message } from "discord.js";
import { Bot } from "./bot";

export default abstract class Command {
    readonly bot: Bot;
    abstract name: string;
    abstract aliases: string[];
    abstract exec(message: Message, ...args: string[]): any;
    requireGuild: boolean = false;
    constructor(bot: Bot) {
        this.bot = bot;
    }
}