'use client';

import { Group, Burger, Button, Avatar, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Navbar() {
  const [opened, { toggle }] = useDisclosure();
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser && storedUser !== 'undefined') {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    checkAuth();
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <header
      style={{
        height: 60,
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--mantine-color-body)',
        zIndex: 1000,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <Group h="100%" justify="space-between">
        {/* Sol: Logo */}
        <Group>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Text size="xl" fw={700}>Local Market</Text>
          </Link>
        </Group>

        {/* Sağ: Kullanıcı */}
        {user ? (
          <Group gap="md" visibleFrom="sm">
            <Group>
              <Avatar src={user.profileImage || undefined} size={30} radius="xl">
                {!user.profileImage && user.username ? user.username.charAt(0).toUpperCase() : null}
              </Avatar>
              <Text size="sm" fw={500}>{user.username}</Text>
            </Group>
            <Button variant="subtle" onClick={() => router.push('/profile')}>Profile</Button>
            <Button variant="subtle" onClick={() => router.push('/my-listings')}>My Listings</Button>
            <Button variant="subtle" onClick={() => router.push('/favorites')}>Favorites</Button>
            <Button variant="light" color="red" onClick={handleLogout}>Logout</Button>
          </Group>
        ) : (
          <Group>
            <Button variant="default" onClick={() => router.push('/login')}>
              Log in
            </Button>
            <Button onClick={() => router.push('/register')}>
              Sign up
            </Button>
          </Group>
        )}
      </Group>
    </header>
  );
}