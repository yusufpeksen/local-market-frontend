'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Image,
  Group,
  Text,
  Button,
  Loader,
  Center,
} from '@mantine/core';
import { useRouter } from 'next/navigation';
import { Listing } from '@/types';
import { FavoriteToggle } from '@/components/FavoriteToggle';
import { motion, AnimatePresence } from 'framer-motion'; 

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFavoritesAndListings = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (!token || !user) {
          router.push('/login');
          return;
        }

        const favRes = await fetch('/api/user/favorites', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const favoriteIds: string[] = await favRes.json();

        const listRes = await fetch('/api/listings');
        const allListings: Listing[] = await listRes.json();

        const mapped = allListings.map((l: any) => ({
          ...l,
          images: l.imageUrls || [],
        }));

        setFavorites(favoriteIds);
        setListings(mapped.filter((l) => favoriteIds.includes(l.id)));
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoritesAndListings();
  }, [router]);

  if (loading) {
    return (
      <Center mt="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="xl">
        My Favorite Listings
      </Title>

      {listings.length === 0 ? (
        <Text>No favorites yet.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          <AnimatePresence>
            {listings.map((listing) => (
              <motion.div
                key={listing.id}
                layout
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20, height: 0, padding: 0, margin: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card withBorder>
                  <Card.Section>
                    <Image
                      src={listing.images?.[0] || ''}
                      height={200}
                      alt={listing.title}
                    />
                  </Card.Section>

                  <Group justify="space-between" mt="md" mb="xs">
                    <Text fw={500} lineClamp={1}>
                      {listing.title}
                    </Text>
                    <Text fw={700} c="blue.7">
                      {Number(listing.price).toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                    </Text>
                  </Group>

                  <Text size="sm" c="dimmed" lineClamp={2} mb="md">
                    {listing.description}
                  </Text>

                  <Group justify="space-between">
                    <Button
                      variant="light"
                      onClick={() => router.push(`/listings/${listing.id}`)}
                    >
                      View
                    </Button>
                    <FavoriteToggle
                      listingId={listing.id}
                      onToggle={(newState) => {
                        if (!newState) {
                          setListings((prev) =>
                            prev.filter((l) => l.id !== listing.id)
                          );
                        }
                      }}
                    />
                  </Group>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </SimpleGrid>
      )}
    </Container>
  );
}