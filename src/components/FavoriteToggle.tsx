'use client';

import { ActionIcon, Tooltip } from '@mantine/core';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export function FavoriteToggle({
  listingId,
  onToggle,
}: {
  listingId: string;
  onToggle?: (newState: boolean) => void;
}) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const jwt = localStorage.getItem('token');

    if (!user || !jwt) return;

    try {
      const parsed = JSON.parse(user);
      setUserId(parsed.id);
      setToken(jwt);

      fetch('/api/user/favorites', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Unauthorized');
          return res.json();
        })
        .then((data: string[]) => {
          setIsFavorited(data.includes(listingId));
        })
        .catch(() => {});
    } catch {
      console.error('Error parsing user or token');
    }
  }, [listingId]);

  const toggleFavorite = async () => {
    if (!userId || !token) return;

    await fetch(`/api/user/favorites/toggle/${listingId}`, {
      method: 'POST',
      headers: {
        'X-User-Id': userId,
        Authorization: `Bearer ${token}`,
      },
    });

    const newState = !isFavorited;
    setIsFavorited(newState);
    onToggle?.(newState);
  };

  return (
    <Tooltip label={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}>
      <ActionIcon onClick={toggleFavorite} variant="light" color="red">
        {isFavorited ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
      </ActionIcon>
    </Tooltip>
  );
}