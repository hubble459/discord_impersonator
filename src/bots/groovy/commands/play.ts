import { GuildMember, Message, TextChannel } from 'discord.js';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import Command from '../../../model/command';
import { SpotifySong, YoutubeSong } from '../../../model/music';
import MusicPlayer, { players } from '../music_player';
import { Spotify, SpotifyTrack } from 'simple-spotify';

export default class Play extends Command {
    spotify: Spotify = new Spotify();
    aliases: string[] = ['p'];
    name: string = 'play';
    override requireGuild: boolean = true;
    async exec(message: Message, ...args: string[]) {
        const player = players.ensure(message.guild!, message.channel as TextChannel);

        if (player.connect(message.member!)) {
            const url = args[0];
            if (!url) {
                player.resume();
            } else if (this.spotify.albumRegex.test(url)) {
                const album = await this.spotify.album(url);
                const tracks = await album.tracks();
                await player.add(...tracks.map((track) => this.spotifyItemToSong(message.member!, track)));
            } else if (this.spotify.artistRegex.test(url)) {
                const artist = await this.spotify.artist(url);
                const albums = await artist.albums();
                const allTracks: SpotifyTrack[] = [];
                for (const album of albums) {
                    const tracks = await album.tracks();
                    allTracks.push(...tracks);
                }
                await player.add(...allTracks.map((track) => this.spotifyItemToSong(message.member!, track)));
            } else if (this.spotify.trackRegex.test(url)) {
                const track = await this.spotify.track(url);
                await player.add(this.spotifyItemToSong(message.member!, track));
            } else if (this.spotify.playlistRegex.test(url)) {
                const playlist = await this.spotify.playlist(url);
                await player.add(
                    ...playlist.tracks.items
                        .filter((i) => !!i.track)
                        .map((item) => this.spotifyItemToSong(message.member!, item.track!))
                );
            } else if (
                /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]list=)|youtu\.be\/)([^"&?\/\s]{11})/gi.test(
                    url
                )
            ) {
                const songs = await this.playlist(message.member!, url);
                await player.add(...songs);
            } else if (
                /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi.test(url)
            ) {
                const song = await this.video(message.member!, url);
                await player.add(song);
            } else {
                const song = await player.searchFirst(message.member!, args.join(' '));
                if (song) {
                    await player.add(song);
                }
            }
        }
    }

    spotifyItemToSong(member: GuildMember, track: SpotifyTrack): SpotifySong {
        return {
            type: 'spotify',
            thumbnail: track.album?.images[0]?.url || '',
            title: (track.artists[0]?.name ? (track.artists[0]?.name + ' ') : '') +  track.name,
            url: track.href,
            requestor: member,
            durationMS: track.duration_ms,
            isLive: false,
        };
    }

    async video(member: GuildMember, url: string): Promise<YoutubeSong> {
        const info = await ytdl.getBasicInfo(url);
        return {
            type: 'youtube',
            thumbnail: info.videoDetails.thumbnails[0].url,
            title: info.videoDetails.title,
            url: info.videoDetails.video_url,
            isLive: info.videoDetails.isLiveContent,
            durationMS: (+info.videoDetails.lengthSeconds || 0) * 1000,
            ageRestricted: info.videoDetails.age_restricted,
            requestor: member,
        };
    }

    async playlist(member: GuildMember, url: string): Promise<YoutubeSong[]> {
        const videos = await ytpl(url);
        return videos.items.map((item) => ({
            type: 'youtube',
            title: item.title,
            isLive: item.isLive,
            url: item.url,
            thumbnail: item.bestThumbnail.url || '',
            durationMS: (item.durationSec || 0) * 1000,
            ageRestricted: false,
            requestor: member,
        }));
    }
}
