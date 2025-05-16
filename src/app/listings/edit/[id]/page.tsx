'use client';

import {
  Container, Title, TextInput, Textarea, Select, Button, Paper, Group,
  SimpleGrid, Image, Stack, Text as MantineText, Alert, LoadingOverlay, Flex
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { IconUpload, IconAlertCircle } from '@tabler/icons-react';
import { Listing } from '@/types';

const formatLira = (value: string): string => {
  const numStr = value.replace(/[^\d]/g, '');
  return numStr === '' ? '' : parseInt(numStr, 10).toLocaleString('tr-TR');
};

const unformatLira = (value: string): string => value.replace(/[^\d]/g, '');

interface ListingFormValues {
  title: string;
  description: string;
  lira: string;
  kurus: string;
  category: string | null;
  imageUrls: string[];
}

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ListingFormValues>({
    initialValues: {
      title: '',
      description: '',
      lira: '',
      kurus: '',
      category: null,
      imageUrls: [],
    },
    validate: {
      title: (v) => (v.trim().length < 3 ? 'Title must be at least 3 characters long' : null),
      description: (v) => (v.trim().length < 10 ? 'Description must be at least 10 characters long' : null),
      lira: (v) => {
        const num = parseInt(unformatLira(v), 10);
        return isNaN(num) || num < 0 ? 'Lira part must be non-negative.' : null;
      },
      kurus: (v) => {
        if (v === '') return null;
        const num = parseInt(v, 10);
        if (isNaN(num) || num < 0 || num > 99) return 'Kurus must be between 0 and 99.';
        if (v.length > 2 && v !== '00') return 'Kurus can have at most 2 digits.';
        return null;
      },
    },
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setPageError('Failed to parse user data. Please log in again.');
        router.push('/login');
      }
    } else {
      setPageError('You need to be logged in to edit listings.');
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!user || !listingId) return;

    const fetchListingDetails = async () => {
      setInitialLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/listings/${listingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          if (response.status === 403 || response.status === 401) {
            throw new Error('You are not authorized to edit this listing.');
          } else if (response.status === 404) {
            throw new Error('Listing not found.');
          }
          throw new Error(`Failed to fetch listing: ${response.status}`);
        }

        const data: Listing = await response.json();

        if (data.sellerId !== user.id) {
          setPageError('You are not authorized to edit this listing.');
          return;
        }

        const parts = String(data.price).split('.');
        const liraPart = parts[0] || '';
        const kurusPart = parts[1] ? parts[1].padEnd(2, '0').substring(0, 2) : '00';

        form.setValues({
          title: data.title,
          description: data.description,
          lira: liraPart,
          kurus: kurusPart,
          category: data.category,
          imageUrls: data.imageUrls || [],
        });

        setExistingImageUrls(data.imageUrls || []);
      } catch (err: any) {
        setPageError(err.message || 'Failed to load listing.');
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchListingDetails();
  }, [user, listingId]);

  const handleSubmit = async (values: ListingFormValues) => {
    if (!user?.id) return;

    setIsSubmitting(true);

    const liraRaw = unformatLira(values.lira);
    const kurus = values.kurus.padStart(2, '0');
    const price = parseFloat(`${liraRaw || '0'}.${kurus || '00'}`);

    if (isNaN(price) || price <= 0) {
      form.setFieldError('lira', 'Price must be a positive number.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/listings/update/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Id': user.id,
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          price,
          category: values.category,
          imageUrls: existingImageUrls,
        }),
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg);
      }

      const updated = await response.json();
      notifications.show({ title: 'Success', message: 'Listing updated!', color: 'green' });
      router.push(`/listings/${updated.id}`);
    } catch (err: any) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (initialLoading) {
    return <LoadingOverlay visible />;
  }

  if (pageError) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle />} title="Error" color="red" mb="lg">{pageError}</Alert>
        <Button onClick={() => router.push('/my-listings')}>Go to My Listings</Button>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Title order={2} ta="center" mb="lg">Edit Listing</Title>
      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            <TextInput required label="Title" placeholder="Enter listing title" {...form.getInputProps('title')} />

            <Textarea required label="Description" placeholder="Describe your item" minRows={4} {...form.getInputProps('description')} />

            <MantineText fw={500} size="sm">Price</MantineText>
            <Flex gap="md">
              <TextInput
                required
                label="Lira"
                style={{ flex: 1 }}
                value={formatLira(form.values.lira)}
                onChange={(e) => form.setFieldValue('lira', unformatLira(e.currentTarget.value))}
                error={form.errors.lira}
              />
              <TextInput
                label="Kurus"
                maxLength={2}
                style={{ width: '100px' }}
                value={form.values.kurus}
                onChange={(e) => {
                  const val = e.currentTarget.value;
                  if (/^\d*$/.test(val) && val.length <= 2) form.setFieldValue('kurus', val);
                }}
                error={form.errors.kurus}
              />
            </Flex>

            <Select
              disabled
              label="Category"
              data={[]}
              value={form.values.category || ''}
              placeholder="Category"
            />

            <div>
              <MantineText fw={500} size="sm" mb={4}>İlan Görselleri</MantineText>
              {existingImageUrls.length > 0 ? (
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm" mt="xs">
                  {existingImageUrls.map((url, index) => (
                    <Paper key={index} withBorder p="xs" radius="sm">
                      <Image src={url} height={100} fit="cover" radius="xs" alt={`Image ${index}`} />
                    </Paper>
                  ))}
                </SimpleGrid>
              ) : (
                <MantineText size="sm" c="dimmed">No images available.</MantineText>
              )}
              <MantineText mt="sm" c="dimmed" size="xs" fs="italic">
                Fotoğraflar değiştirilemez. Yeni fotoğraflar eklemek için lütfen yeni bir ilan oluşturun.
              </MantineText>
            </div>

            <Group justify="flex-end" mt="xl">
              <Button type="submit" loading={isSubmitting} leftSection={<IconUpload size={18} />}>
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
