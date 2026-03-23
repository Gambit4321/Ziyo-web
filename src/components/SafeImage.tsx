'use client';
import { useState } from 'react';

interface Props {
    src: string;
    alt: string;
    className?: string;
    fallbackSrc?: string;
}

export default function SafeImage({ src, alt, className, fallbackSrc = '/images/logo.png' }: Props) {
    const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
    const [hasError, setHasError] = useState(false);

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            onError={() => {
                if (!hasError) {
                    setHasError(true);
                    setImgSrc(fallbackSrc);
                }
            }}
        />
    );
}
