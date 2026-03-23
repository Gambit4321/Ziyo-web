'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export interface Track {
    id: string;
    title: string;
    videoUrl?: string | null;
    content?: string | null;
    thumbnail?: string | null;
    author?: { name: string | null } | null;
}

interface AudioContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    playlist: Track[];
    currentTime: number;
    duration: number;
    volume: number;
    playTrack: (track: Track, newPlaylist?: Track[]) => void;
    togglePlay: () => void;
    setPlaylist: (tracks: Track[]) => void;
    playNext: () => void;
    playPrev: () => void;
    closePlayer: () => void;
    seekTo: (time: number) => void;
    setVolume: (volume: number) => void;
    updatePlaybackState: (currentTime: number, duration: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    // Command-like states for GlobalAudioPlayer to react to
    const [seekToTime, setSeekToTime] = useState<number | null>(null);

    // Load volume from localStorage once
    useEffect(() => {
        const saved = localStorage.getItem('ziyo-player-volume');
        if (saved) setVolume(parseFloat(saved));
    }, []);

    const playTrack = (track: Track, newPlaylist?: Track[]) => {
        console.log("AudioContext: playTrack called", { id: track.id, title: track.title, hasUrl: !!track.videoUrl });

        if (!track.videoUrl) {
            console.warn("AudioContext: Attempted to play track without videoUrl", track);
        }

        if (currentTrack?.id === track.id) {
            setIsPlaying(true);
        } else {
            setCurrentTrack(track);
            setIsPlaying(true);
            setCurrentTime(0);

            if (newPlaylist) {
                setPlaylist(newPlaylist);
            } else if (!playlist.find(t => t.id === track.id)) {
                setPlaylist([track]);
            }
        }
    };

    const togglePlay = () => {
        if (currentTrack) {
            setIsPlaying(!isPlaying);
        }
    };

    const setPlaylistTracks = (tracks: Track[]) => {
        setPlaylist(tracks);
    };

    const closePlayer = () => {
        setIsPlaying(false);
        setCurrentTrack(null);
    };

    const playNext = () => {
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
        if (currentIndex < playlist.length - 1) {
            setCurrentTrack(playlist[currentIndex + 1]);
            setIsPlaying(true);
            setCurrentTime(0);
        } else {
            setIsPlaying(false);
        }
    };

    const playPrev = () => {
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
        if (currentIndex > 0) {
            setCurrentTrack(playlist[currentIndex - 1]);
            setIsPlaying(true);
            setCurrentTime(0);
        }
    };

    const seekTo = (time: number) => {
        console.log("AudioContext: seekTo called", time);
        setSeekToTime(time);
        setCurrentTime(time);
    };

    const handleSetVolume = (v: number) => {
        setVolume(v);
        localStorage.setItem('ziyo-player-volume', v.toString());
    };

    const updatePlaybackState = (c: number, d: number) => {
        setCurrentTime(c);
        setDuration(d);
    };

    return (
        <AudioContext.Provider value={{
            currentTrack,
            isPlaying,
            playlist,
            currentTime,
            duration,
            volume,
            playTrack,
            togglePlay,
            setPlaylist: setPlaylistTracks,
            playNext,
            playPrev,
            closePlayer,
            seekTo,
            setVolume: handleSetVolume,
            updatePlaybackState
        }}>
            <HiddenSeekListener seekToTime={seekToTime} onSeeked={() => setSeekToTime(null)}>
                {children}
            </HiddenSeekListener>
        </AudioContext.Provider>
    );
}

// Internal helper for global player to see seek commands
const HiddenSeekContext = createContext<{ seekToTime: number | null, onSeeked: () => void }>({ seekToTime: null, onSeeked: () => { } });
function HiddenSeekListener({ seekToTime, onSeeked, children }: { seekToTime: number | null, onSeeked: () => void, children: React.ReactNode }) {
    return <HiddenSeekContext.Provider value={{ seekToTime, onSeeked }}>{children}</HiddenSeekContext.Provider>;
}
export function useHiddenSeek() {
    return useContext(HiddenSeekContext);
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
}
