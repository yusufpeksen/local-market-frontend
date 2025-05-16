'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Button,
  Alert,
  SimpleGrid,
  Modal,
  Badge,
  Loader,
} from '@mantine/core';
import { IconEdit, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { Listing } from '@/types';

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch {
        setError('Failed to parse user data. Please log in again.');
        router.push('/login');
        return;
      }
    } else {
      setError('You need to be logged in to view your listings.');
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (currentUser?.id) {
      const fetchListings = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/listings/user/${currentUser.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Failed to fetch listings: ${response.status} ${errorData}`);
          }
          const data = await response.json();
          const mapped = data.map((item: any) => ({
            ...item,
            images: item.imageUrls || [],
          }));
          setListings(mapped);
        } catch (err: any) {
          setError(err.message || 'An unknown error occurred.');
        } finally {
          setLoading(false);
        }
      };
      fetchListings();
    }
  }, [currentUser]);

  const openDeleteConfirmModal = (listing: Listing) => {
    setListingToDelete(listing);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirmModal = () => {
    setListingToDelete(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteListing = async () => {
    if (!listingToDelete || !currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) {
      notifications.show({
        title: 'Authentication Error',
        message: 'You must be logged in to delete listings.',
        color: 'red',
      });
      return;
    }

    try {
      const response = await fetch(`/api/listings/delete/${listingToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': currentUser.id,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete listing: ${errorText}`);
      }

      notifications.show({
        title: 'Success',
        message: `Listing "${listingToDelete.title}" deleted successfully.`,
        color: 'green',
      });
      setListings(listings.filter((l) => l.id !== listingToDelete.id));
      closeDeleteConfirmModal();
    } catch (err: any) {
      notifications.show({
        title: 'Error deleting listing',
        message: err.message || 'An unknown error occurred',
        color: 'red',
      });
      closeDeleteConfirmModal();
    }
  };

  if (!currentUser && !loading) {
    return (
      <Container size="md" my={40}>
        <Alert icon={<IconAlertCircle size={16} />} title="Access Denied" color="red">
          Please <Link href="/login">log in</Link> to view your listings.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container size="md" my={40}>
        <Loader />
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="md" my={40}>
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" my={40}>
      <Title order={2} mb="xl" ta="center">
        My Listings
      </Title>
      {listings.length === 0 ? (
        <Text ta="center">
          You haven't created any listings yet.{' '}
          <Link href="/listings/create">Create one now!</Link>
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {listings.map((listing) => (
            <Card
              shadow="sm"
              radius="md"
              withBorder
              key={listing.id}
              style={{
                height: 440,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Card.Section>
                <img
                  src={
                    listing.images?.length > 0
                      ? listing.images[0]
                      : 'https://via.placeholder.com/300x200?text=No+Image'
                  }
                  height={180}
                  style={{ width: '100%', objectFit: 'contain', backgroundColor: '#f8f9fa' }}
                  alt={listing.title}
                />
              </Card.Section>

              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={500} lineClamp={1}>
                  {listing.title}
                </Text>
                <Badge color="pink" variant="light">
                  {Number(listing.price).toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  })}
                </Badge>
              </Group>

              <Text size="sm" c="dimmed" lineClamp={2}>
                {listing.description}
              </Text>

              <Group mt="md">
                <Button
                  variant="light"
                  color="blue"
                  fullWidth
                  component={Link}
                  href={`/listings/edit/${listing.id}`}
                  leftSection={<IconEdit size={16} />}
                >
                  Edit
                </Button>
                <Button
                  variant="light"
                  color="red"
                  fullWidth
                  onClick={() => openDeleteConfirmModal(listing)}
                  leftSection={<IconTrash size={16} />}
                >
                  Delete
                </Button>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal
        opened={showDeleteConfirm}
        onClose={closeDeleteConfirmModal}
        title="Confirm Deletion"
        centered
      >
        <Text>
          Are you sure you want to delete the listing: "{listingToDelete?.title}"?
        </Text>
        <Group mt="xl" justify="flex-end">
          <Button variant="default" onClick={closeDeleteConfirmModal}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteListing}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}