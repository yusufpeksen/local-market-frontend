'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Container,
  Title,
  TextInput,
  Select,
  Button,
  Card,
  Image,
  Group,
  Text,
  Loader,
  Stack,
  SimpleGrid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
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

const PAGE_SIZE = 8;

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
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
    setIsLoggedIn(!!token && !!user);
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (form.values.keyword) params.append('keyword', form.values.keyword);
      if (form.values.category) params.append('category', form.values.category);
      if (form.values.minPrice) params.append('minPrice', form.values.minPrice);
      if (form.values.maxPrice) params.append('maxPrice', form.values.maxPrice);
      params.append('page', page.toString());
      params.append('size', PAGE_SIZE.toString());

      const res = await fetch(`/api/listings/search?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch listings');

      const data = await res.json();
      const mapped = data.map((item: any) => ({
        ...item,
        images: item.imageUrls || [],
      }));

      setListings((prev) => {
        const existingIds = new Set(prev.map((l: Listing) => l.id));
        const newItems = mapped.filter((l: Listing) => !existingIds.has(l.id));
        return [...prev, ...newItems];
      });

      setHasMore(mapped.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, form.values]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  const handleSearch = () => {
    setListings([]);
    setPage(0);
    setHasMore(true);
  };

  const handleListingClick = (id: string) => {
    router.push(`/listings/${id}`);
  };

  return (
    <Container size="xl" py="xl" style={{ display: 'flex', gap: '2rem' }}>
      {/* Left Sidebar Filters */}
      <div style={{ width: '260px', position: 'sticky', top: '80px', alignSelf: 'flex-start' }}>
        <Title order={3} mb="md">Filters</Title>
        <form onSubmit={form.onSubmit(handleSearch)}>
          <Stack>
            <TextInput
              placeholder="Search..."
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
            <TextInput placeholder="Min Price" type="number" {...form.getInputProps('minPrice')} />
            <TextInput placeholder="Max Price" type="number" {...form.getInputProps('maxPrice')} />
            <Button type="submit">Search</Button>
          </Stack>
        </form>
      </div>

      {/* Main Listings Grid */}
      <div style={{ flex: 1 }}>
        <Group justify="space-between" mb="xl">
          <Title>Listings</Title>
          {isLoggedIn && (
            <Button component={Link} href="/listings/create" leftSection={<IconPlus size={18} />}>
              Create Listing
            </Button>
          )}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {listings.map((listing) => (
            <Card
              key={listing.id}
              withBorder
              shadow="sm"
              style={{
                height: 400,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Card.Section>
                <Image
                  src={listing.images?.[0] || ''}
                  height={180}
                  fit="contain"
                  alt={listing.title}
                />
              </Card.Section>

              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={500} lineClamp={1}>{listing.title}</Text>
                <FavoriteToggle listingId={listing.id} />
              </Group>

              <Text size="sm" c="dimmed" lineClamp={2}>{listing.description}</Text>

              <div style={{ marginTop: 'auto' }}>
                <Button
                  variant="light"
                  fullWidth
                  onClick={() => handleListingClick(listing.id)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </SimpleGrid>

        {loading && <Loader mt="md" />}
        <div ref={observerRef} style={{ height: 1 }} />
      </div>
    </Container>
  );
}