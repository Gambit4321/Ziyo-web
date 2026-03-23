'use client';

import { useEffect, useState } from 'react';

interface Props {
    postId: string;
    initialViews: number;
}

const VIEW_SESSION_KEY = 'ziyo:viewed-posts';

function readViewedPosts() {
    try {
        const raw = sessionStorage.getItem(VIEW_SESSION_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
        return [];
    }
}

function writeViewedPosts(ids: string[]) {
    try {
        sessionStorage.setItem(VIEW_SESSION_KEY, JSON.stringify(ids));
    } catch {
        // Ignore storage failures.
    }
}

export default function PostViewCounter({ postId, initialViews }: Props) {
    const [views, setViews] = useState(initialViews);

    useEffect(() => {
        const viewedPosts = readViewedPosts();

        if (viewedPosts.includes(postId)) {
            return;
        }

        let cancelled = false;

        const markView = async () => {
            try {
                const response = await fetch(`/api/posts/${postId}/view`, {
                    method: 'POST',
                    cache: 'no-store',
                    keepalive: true,
                });

                if (!response.ok) {
                    return;
                }

                const data = (await response.json()) as { views?: number };

                if (!cancelled && typeof data.views === 'number') {
                    setViews(data.views);
                }

                writeViewedPosts([...viewedPosts, postId]);
            } catch {
                // Ignore request failures.
            }
        };

        void markView();

        return () => {
            cancelled = true;
        };
    }, [postId]);

    return <span>{`${views} marta ko'rildi`}</span>;
}
