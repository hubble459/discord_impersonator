import {
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
    joinVoiceChannel,
    StreamType,
    VoiceConnection,
} from '@discordjs/voice';
import { Collection, Guild, GuildMember, Message, TextChannel } from 'discord.js';
import { Song, YoutubeSong } from '../../model/music';
import ytdl from 'ytdl-core-discord';
import ytsr, { Video } from 'ytsr';

export enum RepeatType {
    DISABLED = 0,
    QUEUE = 1,
    SONG = 2,
}

class MusicPlayer {
    readonly player: AudioPlayer;
    readonly guild: Guild;
    readonly songs: Song[];
    repeat: RepeatType;
    audio?: AudioResource<Song>;
    channel: TextChannel;
    voiceConnection?: VoiceConnection;

    constructor(guild: Guild, channel: TextChannel) {
        this.guild = guild;
        this.channel = channel;
        this.player = createAudioPlayer();
        this.songs = [];
        this.repeat = RepeatType.DISABLED;
        this.voiceConnection = getVoiceConnection(guild.id);
        if (!!this.voiceConnection) {
            this.voiceConnection.subscribe(this.player);
        }

        this.playing();
        this.finished();
        this.errored();
    }

    async add(...songs: Song[]) {
        const shouldPlay = !this.songs.length;
        this.songs.push(...songs);
        const description =
            songs.length === 1
                ? `Queued [${songs[0].title}](${songs[0].url}) [<@${songs[0].requestor.id}>]`
                : `Queued **${songs.length}** tracks`;
        this.channel.send({
            embeds: [
                {
                    description,
                    color: 15335205,
                },
            ],
        });
        if (shouldPlay) {
            return this.play();
        }
    }

    connect(member: GuildMember) {
        if (!this.voiceConnection) {
            if (member.voice.channelId) {
                this.voiceConnection = joinVoiceChannel({
                    guildId: this.guild.id,
                    channelId: member.voice.channelId,
                    adapterCreator: this.guild.voiceAdapterCreator,
                });
            } else {
                this.error('You have to be connected to a voice channel before you can use this command!');
                return false;
            }
        }
        return true;
    }

    private async play() {
        const song = this.songs[0];
        if (song && this.connect(song.requestor)) {
            if (this.voiceConnection) {
                this.voiceConnection.subscribe(this.player);
                let audio: AudioResource<Song>;
                if (song.type === 'youtube') {
                    audio = await this.audioResource(song);
                } else if (song.type === 'spotify') {
                    const ytSong = await this.searchFirst(song.requestor, song.title);
                    if (ytSong) {
                        this.songs[0] = ytSong;
                        audio = await this.audioResource(ytSong);
                    } else {
                        this.songs.shift();
                        this.play();
                        return;
                    }
                } else if (song.type === 'soundcloud') {
                    return this.error('Soundcloud WIP');
                } else {
                    return;
                }
                this.audio = audio;
                this.player.play(audio);
            } else {
                this.error('Something went wrong');
            }
        }
    }

    unpause() {
        return this.player.unpause();
    }

    pause() {
        return this.player.pause();
    }

    resume() {
        if (!this.unpause()) {
            if (this.songs.length) {
                this.play();
            }
        }
    }

    skip() {
        if (this.songs.length - 1) {
            this.channel.send({
                embeds: [
                    {
                        description: 'Skipped to the next song 😊',
                        color: 15335205,
                    },
                ],
            });
        }
        if (this.repeat === RepeatType.SONG) {
            this.songs.shift();
        }
        this.player.stop();
    }

    playtime() {
        const song = this.songs[0];
        if (song) {
            if (this.audio) {
                return this.audio.playbackDuration;
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    }

    error(msg: string) {
        this.channel.send({
            embeds: [
                {
                    description: msg,
                    color: 16711680,
                },
            ],
        });
    }

    toggleRepeat(type?: RepeatType) {
        if (type === undefined) {
            this.repeat = (this.repeat + 1) % 3;
        } else {
            this.repeat = type;
        }

        let description: string;
        switch (this.repeat) {
            case RepeatType.DISABLED:
                description = 'Looping is now **disabled**';
                break;
            case RepeatType.QUEUE:
                description = 'Now looping the **queue**';
                break;
            case RepeatType.SONG:
                description = 'Now looping the **current track**';
                break;
        }
        this.channel.send({
            embeds: [
                {
                    description,
                    color: 15335205,
                },
            ],
        });
    }

    async search(member: GuildMember, query: string): Promise<YoutubeSong[]> {
        const result = await ytsr(query, { safeSearch: true });
        return (result.items.filter((item) => item.type === 'video' && !item.isUpcoming) as Video[]).map(
            (item: Video) => ({
                type: 'youtube',
                title: item.title,
                isLive: item.isLive,
                url: item.url,
                thumbnail: item.bestThumbnail.url || '',
                durationMS: this.stringToMilliseconds(item.duration),
                ageRestricted: false,
                requestor: member,
                searchQuery: query,
            })
        );
    }

    async searchFirst(member: GuildMember, query: string): Promise<YoutubeSong | undefined> {
        const songs = await this.search(member, query);
        if (songs[0]) {
            return songs[0];
        } else {
            this.error('No matches found!');
        }
    }

    private finished() {
        this.player.on(AudioPlayerStatus.Idle, () => {
            switch (this.repeat) {
                case RepeatType.DISABLED:
                    this.songs.shift();
                    break;
                case RepeatType.QUEUE:
                    const song = this.songs.shift();
                    if (song) {
                        this.songs.push(song);
                    }
                    break;
            }

            this.play();
        });
    }

    private errored() {
        this.player.on('error', (error) => {
            this.channel.send({
                embeds: [
                    {
                        title: 'Error!',
                        description: '```\n' + error.message + '```',
                        color: 16711680,
                    },
                ],
            });
            if (this.repeat === RepeatType.SONG) {
                this.songs.shift();
            }
        });
    }

    private async audioResource(song: YoutubeSong) {
        return createAudioResource(
            await ytdl(song.url, {
                filter: 'audioonly',
                quality: 'lowestaudio',
                highWaterMark: 1024 * 1024 * 10,
            }),
            {
                inputType: StreamType.Opus,
                metadata: { ...song, started: Date.now(), paused: 0 },
            }
        );
    }

    private playing() {
        this.player.on(AudioPlayerStatus.Playing, async (_, { resource }) => {
            const song: YoutubeSong = resource.metadata as any;
            const msg = await this.channel.send({
                embeds: [
                    {
                        title: 'Now playing',
                        description: `[${song.title}](${song.url}) [<@${song.requestor.id}>]`,
                        color: 15335205,
                    },
                ],
            });
            this.player.once(AudioPlayerStatus.Idle, async () => {
                if (msg instanceof Message) {
                    try {
                        await msg.delete();
                    } catch {
                        console.log(`can't delete message :{`);
                    }
                } else {
                    console.log(`can't delete message :{`);
                }
            });
        });
    }

    private stringToMilliseconds(time?: string | null) {
        if (!time) return 0;
        const split = time.split(':');
        let hours = 0;
        let minutes: number;
        let seconds: number;
        if (split.length === 3) {
            const [h, m, s] = split;
            hours = +h;
            minutes = +m;
            seconds = +s;
        } else {
            const [m, s] = split;
            minutes = +m;
            seconds = +s;
        }
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }
}

export default MusicPlayer;

class Players extends Collection<string, MusicPlayer> {
    ensure(guild: Guild, channel: TextChannel) {
        if (!players.has(guild.id)) {
            players.set(guild.id, new MusicPlayer(guild, channel));
        }
        return players.get(guild.id)!;
    }
}

export const players = new Players();
