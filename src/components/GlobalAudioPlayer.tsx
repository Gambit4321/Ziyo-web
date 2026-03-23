'use client';

import { useEffect, useRef } from 'react';
import { useAudio, useHiddenSeek } from '@/context/AudioContext';

export default function GlobalAudioPlayer() {
    const {
        currentTrack,
        isPlaying,
        volume,
        updatePlaybackState,
        playNext,
        togglePlay
    } = useAudio();

    const { seekToTime, onSeeked } = useHiddenSeek();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sync play/pause
    useEffect(() => {
        if (!audioRef.current) return;
        console.log("GlobalAudioPlayer: Syncing playback state", { isPlaying, trackId: currentTrack?.id });
        if (isPlaying) {
            audioRef.current.play().catch(e => console.warn("Playback failed", e));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, currentTrack]);

    // Sync volume
    useEffect(() => {
        if (!audioRef.current) return;
        console.log("GlobalAudioPlayer: Syncing volume", volume);
        audioRef.current.volume = volume;
    }, [volume]);

    // Sync seeking (handling command from context)
    useEffect(() => {
        if (!audioRef.current || seekToTime === null) return;
        console.log("GlobalAudioPlayer: Explicit seek received", seekToTime);
        audioRef.current.currentTime = seekToTime;
        onSeeked();
    }, [seekToTime, onSeeked]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            updatePlaybackState(audioRef.current.currentTime, audioRef.current.duration);
        }
    };

    if (!currentTrack?.videoUrl) return null;

    return (
        <audio
            ref={audioRef}
            key={currentTrack.id} // Re-mount when track changes to ensure fresh state and buffer
            src={currentTrack.videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onEnded={playNext}
            style={{ display: 'none' }}
        />
    );
}
