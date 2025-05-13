'use client';

import { Container, Title, TextInput, PasswordInput, Button, Paper, Text, Anchor, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Eğer kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const form = useForm<LoginForm>({
    initialValues: {
      username: '',
      password: '',
    }
  });

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Token'ı ve user bilgisini kaydet
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      notifications.show({
        title: 'Success',
        message: 'Logged in successfully',
        color: 'green',
      });

      window.location.href = '/';
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
    <Container size={420} my={40}>
      <Title ta="center" fw={900}>
        Welcome back!
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Don't have an account yet?{' '}
        <Anchor component={Link} href="/register" size="sm">
          Create account
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Username"
              placeholder="Your username"
              required
              {...form.getInputProps('username')}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps('password')}
            />
          </Stack>

          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Sign in
          </Button>
        </form>
      </Paper>
    </Container>
  );
} 