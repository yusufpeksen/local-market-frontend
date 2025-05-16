'use client';

import { Container, Title, Text, SimpleGrid, Card, Image, Group, Badge, Button, TextInput, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import { Listing } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FavoriteToggle } from '@/components/FavoriteToggle';

interface SearchForm {
  keyword: string;
  category: string;
  minPrice: string;
  maxPrice: string;
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const form = useForm<SearchForm>({
    initialValues: {
      keyword: '',
      category: '',
      minPrice: '',
      maxPrice: '',
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
    fetchAllListings();
  }, []);

  const fetchAllListings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/listings');
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      const data = await response.json();
      const mapped = data.map((item: any) => ({
        ...item,
        images: item.imageUrls || [],
      }));
      mapped.sort((a: Listing, b: Listing) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setListings(mapped);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (values: SearchForm) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (values.keyword) params.append('keyword', values.keyword);
      if (values.category) params.append('category', values.category);
      if (values.minPrice) params.append('minPrice', values.minPrice);
      if (values.maxPrice) params.append('maxPrice', values.maxPrice);

      const response = await fetch(`/api/listings/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to search listings');
      }
      const data = await response.json();
      const mapped = data.map((item: any) => ({
        ...item,
        images: item.imageUrls || [],
      }));
      mapped.sort((a: Listing, b: Listing) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setListings(mapped);
    } catch (error) {
      console.error('Error searching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    form.reset();
    fetchAllListings();
  };

  const handleListingClick = (id: string) => {
    router.push(`/listings/${id}`);
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1} ta="center">Local Market</Title>
        {isLoggedIn && (
          <Button component={Link} href="/listings/create" leftSection={<IconPlus size={18} />}>
            Create Listing
          </Button>
        )}
      </Group>
      
      <Card withBorder p="xl" mb="xl">
        <form onSubmit={form.onSubmit(handleSearch)}>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <TextInput
              placeholder="Search listings..."
              leftSection={<IconSearch size={16} />}
              {...form.getInputProps('keyword')}
            />
            <Select
              placeholder="Category"
              data={[
                { value: 'electronics', label: 'Electronics' },
                { value: 'furniture', label: 'Furniture' },
                { value: 'clothing', label: 'Clothing' },
                { value: 'books', label: 'Books' },
              ]}
              {...form.getInputProps('category')}
            />
            <TextInput
              placeholder="Min Price"
              type="number"
              {...form.getInputProps('minPrice')}
            />
            <TextInput
              placeholder="Max Price"
              type="number"
              {...form.getInputProps('maxPrice')}
            />
          </SimpleGrid>
          <Group justify="center" mt="md">
            <Button type="submit" loading={loading}>
              Search
            </Button>
            <Button variant="default" onClick={handleClearFilters} disabled={loading}>
              Clear Filters
            </Button>
          </Group>
        </form>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
  {listings.map((listing) => (
    <Card
      key={listing.id}
      withBorder
      shadow="sm"
      radius="md"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <Card.Section>
        <Image src={listing.images?.[0] || ''} height={200} alt={listing.title} />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500} lineClamp={1}>{listing.title}</Text>
        <FavoriteToggle listingId={listing.id} />
      </Group>

      <Text size="sm" c="dimmed" lineClamp={2} style={{ flexGrow: 1 }}>
        {listing.description}
      </Text>

      <Button
        variant="light"
        fullWidth
        mt="md"
        onClick={() => handleListingClick(listing.id)}
        style={{ marginTop: 'auto' }}
      >
        View Details
      </Button>
    </Card>
  ))}
</SimpleGrid>
    </Container>
  );
}
