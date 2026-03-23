'use client';

import { Play, Pause, Volume2 } from 'lucide-react';
import styles from './AudioPlayer.module.css';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAudio, Track } from '@/context/AudioContext';
import WaveformProgressBar from './WaveformProgressBar';

interface Props {
    tracks?: Track[];
    showPlaylist?: boolean;
}

export default function AudioPlayer({ tracks = [], showPlaylist = true }: Props) {
    const {
        currentTrack: globalTrack,
        isPlaying: globalIsPlaying,
        playTrack,
        togglePlay: globalTogglePlay,
        currentTime,
        duration,
        volume,
        seekTo,
        setVolume
    } = useAudio();

    const progressRef = useRef<HTMLDivElement>(null);
    const volumeRef = useRef<HTMLDivElement>(null);

    // Use globalTrack if it exists, otherwise fall back to the first track in props
    const activeTrack = globalTrack || tracks[0];
    const isCurrentTrackPlaying = !!(globalTrack && globalIsPlaying && globalTrack.id === activeTrack?.id);
    const isTrackActiveInContext = globalTrack?.id === activeTrack?.id;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || !activeTrack) return;

        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));

        console.log("AudioPlayer: Progress bar clicked", { percentage, isTrackActiveInContext });

        if (isTrackActiveInContext) {
            seekTo(percentage * duration);
        } else {
            // If clicking progress bar while not the active track, start playing it
            playTrack(activeTrack, tracks.length > 0 ? tracks : undefined);
        }
    };

    const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!volumeRef.current) return;

        const rect = volumeRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newVolume = Math.max(0, Math.min(1, x / rect.width));

        console.log("AudioPlayer: Volume bar clicked", { newVolume });
        setVolume(newVolume);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayClick = () => {
        if (activeTrack) {
            if (isTrackActiveInContext) {
                globalTogglePlay();
            } else {
                playTrack(activeTrack, tracks.length > 0 ? tracks : undefined);
            }
        }
    };

    if (!activeTrack) return null;

    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>AUDIOMAHSULOTLAR</h2>
                <div className={styles.line}></div>
                <Link href="/category/audio" className={styles.viewAll}>Barchasini ko'rish</Link>
            </div>

            <div className={styles.playerLayout}>
                <div className={styles.mainPlayer}>
                    <div className={styles.playerWrapper}>
                        <div className={`${styles.coverArt} ${isCurrentTrackPlaying ? styles.rotating : ''}`}>
                            <div className={styles.vinyl}>
                                {activeTrack.thumbnail ? (
                                    <div className={styles.thumbnailLabel} style={{ backgroundImage: `url(${activeTrack.thumbnail})` }}></div>
                                ) : (
                                    <div className={styles.centerLabel}></div>
                                )}
                            </div>
                        </div>

                        <div className={styles.controls}>
                            <div className={styles.trackInfo}>
                                <span className={styles.badge}>
                                    {isTrackActiveInContext ? 'Hozir eshitilmoqda' : 'Tavsiya etiladi'}
                                </span>
                                <h3 className={styles.trackTitle}>{activeTrack.title}</h3>
                                <p className={styles.author}>{activeTrack.author?.name || 'Ziyo Media'}</p>
                            </div>

                            {activeTrack.videoUrl && (
                                <div className={styles.waveformContainer}>
                                    <WaveformProgressBar
                                        audioUrl={activeTrack.videoUrl}
                                        isActive={isTrackActiveInContext}
                                    />
                                </div>
                            )}

                            <div className={styles.buttons}>
                                <button className={styles.playBtn} onClick={handlePlayClick}>
                                    {isCurrentTrackPlaying ? <Pause fill="black" size={24} /> : <Play fill="black" size={24} className={styles.playIcon} />}
                                </button>

                                <div className={styles.time}>
                                    {formatTime(isTrackActiveInContext ? currentTime : 0)} / {formatTime(isTrackActiveInContext ? duration : 0)}
                                </div>

                                <div className={styles.volume}>
                                    <Volume2 size={20} />
                                    <div
                                        className={styles.volBar}
                                        ref={volumeRef}
                                        onClick={handleVolumeClick}
                                    >
                                        <div className={styles.volLevel} style={{ width: `${volume * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showPlaylist && tracks.length > 0 && (
                    <div className={styles.playlistWrapper}>
                        <h4 className={styles.playlistTitle}>Playlist</h4>
                        <div className={styles.playlist}>
                            {tracks.map((track) => (
                                <div
                                    key={track.id}
                                    className={`${styles.trackItem} ${globalTrack?.id === track.id ? styles.activeTrack : ''}`}
                                    onClick={() => playTrack(track, tracks)}
                                >
                                    <div className={styles.trackIcon}>
                                        {globalTrack?.id === track.id && globalIsPlaying ? <Pause size={14} /> : <Play size={14} />}
                                    </div>
                                    <div className={styles.trackMeta}>
                                        <p className={styles.itemTitle}>{track.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
