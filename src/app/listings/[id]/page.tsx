'use client';

import { Container, Title, Text, Paper, Group, Button, Stack, Textarea, Avatar, Badge, Image, Divider, Grid, Table, ActionIcon, Box } from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { IconMessage, IconMail, IconChevronLeft, IconChevronRight, IconPhone, IconMapPin, IconUserCircle } from '@tabler/icons-react';
import { Listing } from '@/types';
import { useRouter } from 'next/navigation';

// Define a type for Seller Information based on UserResponseDTO
interface SellerInfo {
  id: string; // Assuming UUID is string here
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  district?: string;
  address?: string;
  phoneNumber?: string;
  profileImage?: string;
  createdAt: string; // Assuming LocalDateTime is string here from JSON
}

interface MessageForm {
  content: string;
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null); // Typed state
  const [loading, setLoading] = useState(false);
  const [loadingSeller, setLoadingSeller] = useState(false);
  const [messages, setMessages] = useState<any[]>([]); // Keep as any for now if message structure is not defined
  const [currentUser, setCurrentUser] = useState<any>(null); // Keep as any if user structure for current user is generic
  const [activeSlide, setActiveSlide] = useState(0);

  const router = useRouter();

  const messageForm = useForm<MessageForm>({
    initialValues: {
      content: '',
    },
    validate: {
      content: (value) => (value.length < 1 ? 'Message cannot be empty' : null),
    },
  });

  useEffect(() => {
    const fetchListingAndSeller = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/listings/${params.id}`);
        const data = await response.json();
        const mapped = {
          ...data,
          images: data.imageUrls || [],
        };
        setListing(mapped);

        if (data.sellerId) {
          setLoadingSeller(true);
          try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const sellerResponse = await fetch(`/api/user/profile/${data.sellerId}`, { headers });

            if (sellerResponse.ok) {
              const sellerData: SellerInfo = await sellerResponse.json(); // Type assertion
              setSellerInfo(sellerData);
            } else {
              console.error('Failed to fetch seller info', sellerResponse.status, await sellerResponse.text());
              setSellerInfo(null);
            }
          } catch (sellerError) {
            console.error('Error fetching seller info:', sellerError);
            setSellerInfo(null);
          } finally {
            setLoadingSeller(false);
          }
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    };

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setCurrentUser(JSON.parse(storedUser)); } catch (e) { /* ignore */ }
    }
    fetchListingAndSeller();
  }, [params.id]);

  const startConversation = async () => {
    if (!currentUser || !listing?.sellerId) return;
  
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/messages/conversation/${listing.id}/${currentUser.id}/${listing.sellerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
  
      if (!res.ok) {
        throw new Error('Failed to get or create conversation');
      }
  
      const conversationId = await res.json();
      router.push(`/chat/${conversationId}?listingId=${listing.id}&receiverId=${listing.sellerId}`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: (error as Error).message,
        color: 'red',
      });
    }
  };

  const handleSendMessage = async (values: MessageForm) => {
    if (!currentUser) {
      notifications.show({
        title: 'Error',
        message: 'Please log in to send messages',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        body: JSON.stringify({
          content: values.content,
          senderId: currentUser.id,
          receiverId: listing?.sellerId,
          listingId: params.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      notifications.show({
        title: 'Success',
        message: 'Message sent successfully',
        color: 'green',
      });

      messageForm.reset();
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

  if (!listing) {
    return (
      <Container size="md" my={40}>
        <Text>{loading ? 'Loading listing details...' : 'Could not load listing details.'}</Text>
      </Container>
    );
  }

  // Format createdAt for display
  const formattedDate = new Date(listing.createdAt).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const formattedSellerJoinDate = sellerInfo?.createdAt ? new Date(sellerInfo.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : 'N/A';

  return (
    <Container size="lg" my={40}>
      <Paper withBorder shadow="md" p={30} radius="lg">
        <Grid gutter={{ base: 32, md: 80, lg: 96 }}>
          {/* Sol: Görseller */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="sm" radius="md" p={0} style={{ background: '#f8fafd', margin: '0 auto' }}>
              {listing.images && listing.images.length > 0 ? (
                <Stack gap={8}>
                  <Carousel
                    withIndicators
                    height={360}
                    slideSize="100%"
                    slideGap="md"
                    style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
                    controlSize={32}
                    controlsOffset="xs"
                    nextControlIcon={<IconChevronRight size={24} stroke={2.2} color="#1971c2" />}
                    previousControlIcon={<IconChevronLeft size={24} stroke={2.2} color="#1971c2" />}
                    onSlideChange={setActiveSlide}
                    styles={{
                      control: {
                        background: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        borderRadius: 24,
                        border: '1.5px solid #1971c2',
                        top: '50%',
                        left: '-32px',
                        right: '-32px',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                      },
                      controls: {
                        left: 0,
                        right: 0,
                        justifyContent: 'space-between',
                        width: '100%',
                      },
                    }}
                  >
                    {listing.images.map((image: string, index: number) => (
                      <Carousel.Slide key={index}>
                        <Image
                          src={image}
                          height={360}
                          alt={`Listing image ${index + 1}`}
                          fit="contain"
                          radius="md"
                          style={{ background: '#fff', borderRadius: 16 }}
                        />
                      </Carousel.Slide>
                    ))}
                  </Carousel>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px', padding: '8px 0' }}>
                    {listing.images.map((image: string, index: number) => (
                      <div
                        key={index}
                        style={{
                          border: activeSlide === index ? '2px solid #1971c2' : '2px solid #e3e7ef',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          width: '60px',
                          height: '60px',
                          boxSizing: 'border-box',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f4f6fa',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          transition: 'transform 0.15s',
                        }}
                      >
                        <Image
                          src={image}
                          height={60}
                          width={60}
                          alt={`Thumbnail ${index + 1}`}
                          fit="cover"
                          radius="sm"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                </Stack>
              ) : (
                <Image
                  src={listing.images?.[0] || ''}
                  height={360}
                  alt="No image available"
                  fit="cover"
                  radius="md"
                  style={{ background: '#fff', borderRadius: 16 }}
                />
              )}
            </Paper>
          </Grid.Col>

          {/* Sağ: Detaylar ve Satıcı */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="sm" radius="md" p="xl" style={{ background: '#f8fafd', margin: '0 auto' }}>
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start" wrap="wrap">
                  <Title order={2} style={{ fontWeight: 700, flexGrow: 1 }}>{listing.title}</Title>
                  <Text size="xl" fw={700} c="blue.7" style={{ whiteSpace: 'nowrap' }}>
                    {Number(listing.price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </Text>
                </Group>
                <Table striped highlightOnHover verticalSpacing="sm" style={{ fontSize: 16, borderRadius: 12, overflow: 'hidden' }}>
                  <tbody>
                    <tr><td style={{ fontWeight: 500, width: '30%' }}>İlan Tarihi</td><td>{formattedDate}</td></tr>
                    <tr><td style={{ fontWeight: 500 }}>Kategori</td><td>{listing.category}</td></tr>
                    <tr><td style={{ fontWeight: 500 }}>İlan No</td><td>{listing.id}</td></tr>
                  </tbody>
                </Table>

                <Title order={4} mt="lg" mb="xs">Seller Information</Title>
                <Paper withBorder shadow="xs" radius="md" p="lg" style={{ background: '#fff' }}>
                  {loadingSeller ? (
                    <Text>Loading seller info...</Text>
                  ) : sellerInfo ? (
                    <Stack gap="md">
                      <Group gap="md" align="center">
                        <Avatar src={sellerInfo.profileImage || undefined} alt={sellerInfo.username} size={60} radius="xl" />
                        <Box flex={1}>
                          <Text fw={700} size="lg">
                            {sellerInfo.firstName && sellerInfo.lastName ? `${sellerInfo.firstName} ${sellerInfo.lastName}` : sellerInfo.username}
                          </Text>
                          <Text size="sm" c="dimmed">@{sellerInfo.username}</Text>
                        </Box>
                      </Group>
                      
                      <Divider />

                      <Group gap="xs">
                        <IconMapPin size={18} stroke={1.5} />
                        <Text size="sm">
                          {sellerInfo.city && sellerInfo.district ? `${sellerInfo.district}, ${sellerInfo.city}` : 'Location not specified'}
                        </Text>
                      </Group>
                      {sellerInfo.address && (
                        <Group gap="xs">
                           {/* Intentionally not showing an icon for address to avoid clutter or use a generic one if preferred */}
                           <Text size="sm" c="dimmed" pl={26}> {sellerInfo.address} </Text> {/* Indent to align with other items */}
                        </Group>
                      )}
                      {sellerInfo.phoneNumber && (
                        <Group gap="xs">
                          <IconPhone size={18} stroke={1.5} />
                          <Text size="sm">{sellerInfo.phoneNumber}</Text>
                        </Group>
                      )}
                      <Group gap="xs">
                        <IconUserCircle size={18} stroke={1.5} />
                        <Text size="sm">Joined: {formattedSellerJoinDate}</Text>
                      </Group>
                    
                      {currentUser && listing && currentUser.id !== listing.sellerId && (
                        <Button fullWidth mt="md" size="md" leftSection={<IconMail size={18} />}     onClick={startConversation}
>
                          Send Message to Seller
                        </Button>
                      )}
                    </Stack>
                  ) : (
                    <Text>Seller information not available.</Text>
                  )}
                </Paper>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
        <Divider my="xl" />
        {/* Açıklama */}
        <Paper withBorder shadow="xs" radius="md" p="lg" style={{ background: '#f8fafd' }}>
          <Title order={4} style={{ fontWeight: 600, marginBottom: 8 }}>Açıklama</Title>
          <Text size="lg" style={{ color: '#222', lineHeight: 1.7 }}>{listing.description}</Text>
        </Paper>
      </Paper>
    </Container>
  );
} 