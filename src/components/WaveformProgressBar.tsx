'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import styles from './WaveformProgressBar.module.css';
import { useAudio } from '@/context/AudioContext';

interface Props {
    audioUrl: string;
    isActive: boolean;
}

export default function WaveformProgressBar({ audioUrl, isActive }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const { currentTime, duration, isPlaying, seekTo } = useAudio();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#4a5568', // text-gray-ish
            progressColor: '#c6a866', // primary-gold
            cursorColor: '#c6a866',
            barWidth: 2,
            barRadius: 3,
            cursorWidth: 1,
            height: 40,
            barGap: 3,
            normalize: true,
            // Interaction: false, // We'll handle seeking via events if needed, or let WS handle it and sync back
        });

        ws.load(audioUrl);
        wavesurferRef.current = ws;

        ws.on('ready', () => {
            setIsReady(true);
        });

        ws.on('interaction', (newTime) => {
            // wavesurfer reports interaction as time
            seekTo(newTime);
        });

        return () => {
            ws.destroy();
        };
    }, [audioUrl, seekTo]);

    // Sync external time with wavesurfer
    useEffect(() => {
        if (!wavesurferRef.current || !isReady || !isActive) return;

        // Prevent infinite loops if WS interaction triggers seekTo which triggers this effect
        const wsTime = wavesurferRef.current.getCurrentTime();
        if (Math.abs(wsTime - currentTime) > 0.1) {
            wavesurferRef.current.setTime(currentTime);
        }
    }, [currentTime, isReady, isActive]);

    return (
        <div className={styles.container}>
            <div ref={containerRef} className={styles.waveform} />
            {!isReady && audioUrl && (
                <div className={styles.loader}>Yuklanmoqda...</div>
            )}
        </div>
    );
}
