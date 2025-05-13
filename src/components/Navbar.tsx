'use client';

import { Group, Burger, Button, UnstyledButton, Avatar, Text, Menu, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconLogout, IconUser, IconSettings } from '@tabler/icons-react';
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
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkAuth();
    // Her 5 saniyede bir auth durumunu kontrol et
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
    <header style={{ 
      height: '60px', 
      borderBottom: '1px solid var(--mantine-color-gray-3)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'var(--mantine-color-body)',
      zIndex: 1000
    }}>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Text size="xl" fw={700}>Local Market</Text>
          </Link>
        </Group>

        <Group>
          {user ? (
            <Menu
              width={200}
              position="bottom-end"
              transitionProps={{ transition: 'pop-top-right' }}
            >
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={7}>
                    <Avatar size={30} radius="xl" />
                    <Text fw={500} size="sm" lh={1} mr={3}>
                      {user.username}
                    </Text>
                    <IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconUser style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
                  onClick={() => router.push('/profile')}
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconSettings style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
                  onClick={() => router.push('/settings')}
                >
                  Settings
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
                  onClick={handleLogout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
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
      </Group>
    </header>
  );
} 