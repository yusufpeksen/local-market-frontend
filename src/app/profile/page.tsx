'use client';

import { Container, Title, TextInput, PasswordInput, Button, Paper, Text, Stack, Tabs, Avatar, Group, FileInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { IconUpload } from '@tabler/icons-react';

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const profileForm = useForm<ProfileForm>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      phoneNumber: (value) => (value ? /^\+?[\d\s-]{10,}$/.test(value) ? null : 'Invalid phone number' : null),
    },
  });

  const passwordForm = useForm<PasswordForm>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      newPassword: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) => (value !== values.newPassword ? 'Passwords do not match' : null),
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await fetch(`/api/user/profile/${userId}`);
        const data = await response.json();

        if (response.ok) {
          setUser(data);
          profileForm.setValues({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleProfileUpdate = async (values: ProfileForm) => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/user/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
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

  const handlePasswordChange = async (values: PasswordForm) => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/user/change-password/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      notifications.show({
        title: 'Success',
        message: 'Password changed successfully',
        color: 'green',
      });

      passwordForm.reset();
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
      <Title order={2} mb="xl">Profile Settings</Title>

      <Tabs defaultValue="profile">
        <Tabs.List>
          <Tabs.Tab value="profile">Profile Information</Tabs.Tab>
          <Tabs.Tab value="password">Change Password</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profile" pt="xl">
          <Paper withBorder shadow="md" p={30} radius="md">
            <Group mb="xl">
              <Avatar size={100} radius="xl" />
              <FileInput
                label="Profile Picture"
                placeholder="Upload new picture"
                accept="image/*"
                leftSection={<IconUpload size={14} />}
              />
            </Group>

            <form onSubmit={profileForm.onSubmit(handleProfileUpdate)}>
              <Stack>
                <TextInput
                  label="First Name"
                  placeholder="John"
                  required
                  {...profileForm.getInputProps('firstName')}
                />
                <TextInput
                  label="Last Name"
                  placeholder="Doe"
                  required
                  {...profileForm.getInputProps('lastName')}
                />
                <TextInput
                  label="Email"
                  placeholder="you@example.com"
                  required
                  {...profileForm.getInputProps('email')}
                />
                <TextInput
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  {...profileForm.getInputProps('phoneNumber')}
                />
              </Stack>

              <Button fullWidth mt="xl" type="submit" loading={loading}>
                Update Profile
              </Button>
            </form>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="password" pt="xl">
          <Paper withBorder shadow="md" p={30} radius="md">
            <form onSubmit={passwordForm.onSubmit(handlePasswordChange)}>
              <Stack>
                <PasswordInput
                  label="Current Password"
                  placeholder="Your current password"
                  required
                  {...passwordForm.getInputProps('currentPassword')}
                />
                <PasswordInput
                  label="New Password"
                  placeholder="Your new password"
                  required
                  {...passwordForm.getInputProps('newPassword')}
                />
                <PasswordInput
                  label="Confirm New Password"
                  placeholder="Confirm your new password"
                  required
                  {...passwordForm.getInputProps('confirmPassword')}
                />
              </Stack>

              <Button fullWidth mt="xl" type="submit" loading={loading}>
                Change Password
              </Button>
            </form>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
} 