'use client';

import { Container, Title, Paper, Stack, Text, Group, Button, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { IconBell, IconTrash } from '@tabler/icons-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [userNotifications, setUserNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications/${user.id}`, {
        headers: {
          'X-User-Id': user.id,
        },
      });
      const data = await response.json();
      setUserNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setUserNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      notifications.show({
        title: 'Success',
        message: 'Notification marked as read',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Something went wrong',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      setUserNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );

      notifications.show({
        title: 'Success',
        message: 'Notification deleted',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Something went wrong',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" my={40}>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Notifications</Title>
        <Badge size="lg" variant="light">
          {userNotifications.filter((n) => !n.read).length} unread
        </Badge>
      </Group>

      <Stack>
        {userNotifications.length === 0 ? (
          <Paper withBorder shadow="md" p="xl" radius="md">
            <Stack align="center" gap="xs">
              <IconBell size={48} color="gray" />
              <Text c="dimmed" size="lg">
                No notifications yet
              </Text>
            </Stack>
          </Paper>
        ) : (
          userNotifications.map((notification) => (
            <Paper
              key={notification.id}
              withBorder
              shadow="md"
              p="md"
              radius="md"
              style={{
                opacity: notification.read ? 0.7 : 1,
              }}
            >
              <Group justify="space-between">
                <Stack gap={4}>
                  <Text fw={500}>{notification.title}</Text>
                  <Text size="sm" c="dimmed">
                    {notification.message}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(notification.createdAt).toLocaleString()}
                  </Text>
                </Stack>
                <Group>
                  {!notification.read && (
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      loading={loading}
                    >
                      Mark as read
                    </Button>
                  )}
                  <Button
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    loading={loading}
                    leftSection={<IconTrash size={16} />}
                  >
                    Delete
                  </Button>
                </Group>
              </Group>
            </Paper>
          ))
        )}
      </Stack>
    </Container>
  );
} 