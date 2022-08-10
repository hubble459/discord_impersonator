import { GuildMember } from 'discord.js';

export type SongType = 'youtube' | 'spotify' | 'soundcloud';

export type BaseSong = {
    type: SongType;
    title: string;
    thumbnail: string;
    isLive: boolean;
    url: string;
    requestor: GuildMember;
    searchQuery?: string;
    durationMS: number;
};

export type SpotifySong = BaseSong & {
    type: 'spotify';
};

export type YoutubeSong = BaseSong & {
    type: 'youtube';
    ageRestricted: boolean;
};

export type SoundCloudSong = BaseSong & {
    type: 'soundcloud';
};

export type Song = SpotifySong | YoutubeSong | SoundCloudSong;

export type Queue = {
    guildID: string;
    songs: Song[];
};
