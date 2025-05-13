'use client';

import { Container, Title, TextInput, Textarea, NumberInput, Select, Button, Paper, Group, FileInput, SimpleGrid, Image, ActionIcon, Stack, Text as MantineText } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';

interface ListingFormValues {
  title: string;
  description: string;
  price: number | '';
  category: string | null;
  // Resimler dosya olarak alınacak, sonra URL'ye çevrilecek
}

export default function CreateListingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const form = useForm<ListingFormValues>({
    initialValues: {
      title: '',
      description: '',
      price: '',
      category: null,
    },
    validate: {
      title: (value) => (value.trim().length < 3 ? 'Title must be at least 3 characters long' : null),
      description: (value) => (value.trim().length < 10 ? 'Description must be at least 10 characters long' : null),
      price: (value) => (value === '' || (typeof value === 'number' && value <= 0) ? 'Price must be a positive number' : null),
      category: (value) => (value === null ? 'Category must be selected' : null),
    },
  });

  const handleFileChange = (selectedFiles: File[] | null) => {
    if (selectedFiles) {
      setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setImagePreviews(prevPreviews => {
      const currentPreview = prevPreviews[index];
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview); // Clean up specific old preview
      }
      return prevPreviews.filter((_, i) => i !== index);
    });
  };
  
  const handleSubmit = async (values: ListingFormValues) => {
    if (!user || !user.id) {
      notifications.show({ title: 'Authentication Error', message: 'User not found or user ID is missing. Please log in again.', color: 'red' });
      router.push('/login');
      return;
    }
    if (files.length === 0) {
      notifications.show({ title: 'Error', message: 'Please upload at least one image', color: 'red' });
      return;
    }

    setLoading(true);
    setIsUploading(true);
    const uploadedImageUrls: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadResponse = await fetch('/api/listings/upload', {
          method: 'POST',
          body: formData,
          headers: {
             // Gerekirse token veya user id eklenebilir, backend'e bağlı
             // 'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        });
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        const imageUrl = await uploadResponse.text(); // Backend'in URL'yi text olarak döndüğünü varsayıyoruz
        uploadedImageUrls.push(imageUrl);
      }
    } catch (error: any) {
      notifications.show({ title: 'Image Upload Error', message: error.message || 'Could not upload images', color: 'red' });
      setIsUploading(false);
      setLoading(false);
      return;
    }
    setIsUploading(false);

    try {
      const listingData = {
        ...values,
        price: Number(values.price),
        imageUrls: uploadedImageUrls,
      };

      if (!user.id) {
        notifications.show({ title: 'Error', message: 'User ID is missing before creating listing.', color: 'red' });
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        notifications.show({ title: 'Authentication Error', message: 'Authentication token not found. Please log in again.', color: 'red' });
        router.push('/login');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(listingData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create listing. Status: ' + response.status }));
        throw new Error(errorData.message);
      }

      const newListing = await response.json();
      notifications.show({ title: 'Success', message: 'Listing created successfully!', color: 'green' });
      router.push(`/listings/${newListing.id}`); // Yeni ilanın sayfasına yönlendir
    } catch (error: any) {
      notifications.show({ title: 'Listing Creation Error', message: error.message || 'Something went wrong', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clean up object URLs when component unmounts or previews change
    return () => {
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  if (!user) {
    return <Container><MantineText>Loading user...</MantineText></Container>; // MantineText kullanıldı
  }

  return (
    <Container size="md" py="xl">
      <Title order={2} ta="center" mb="lg">Create New Listing</Title>
      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            <TextInput
              required
              label="Title"
              placeholder="Enter listing title"
              {...form.getInputProps('title')}
            />
            <Textarea
              required
              label="Description"
              placeholder="Describe your item in detail"
              minRows={4}
              {...form.getInputProps('description')}
            />
            <NumberInput
              required
              label="Price"
              placeholder="Enter price"
              min={0.01} // Price must be at least 0.01
              step={0.01} // Adım değeri
              decimalSeparator="."
              {...form.getInputProps('price')}
            />
            <Select
              required
              label="Category"
              placeholder="Select a category"
              data={[
                { value: 'electronics', label: 'Electronics' },
                { value: 'furniture', label: 'Furniture' },
                { value: 'clothing', label: 'Clothing' },
                { value: 'books', label: 'Books' },
                { value: 'vehicles', label: 'Vehicles' },
                { value: 'property', label: 'Property' },
                { value: 'other', label: 'Other' },
              ]}
              {...form.getInputProps('category')}
            />
            
            <FileInput
              label="Upload Images"
              placeholder="Click to select images"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              leftSection={<IconPhoto size={18} />}
              description={`${files.length} image(s) selected. You can upload multiple.`}
            />

            {imagePreviews.length > 0 && (
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm" mt="xs">
                {imagePreviews.map((src, index) => (
                  <Paper key={index} withBorder p="xs" radius="sm" style={{ position: 'relative' }}>
                    <Image src={src} height={100} alt={`Preview ${index}`} fit="cover" radius="xs" />
                    <ActionIcon
                      color="red"
                      variant="filled"
                      size="sm"
                      onClick={() => removeImage(index)}
                      style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}
                      title="Remove image"
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  </Paper>
                ))}
              </SimpleGrid>
            )}

            <Group justify="flex-end" mt="xl">
              <Button type="submit" loading={loading || isUploading} leftSection={<IconUpload size={18} />}>
                {isUploading ? 'Uploading Images...' : (loading ? 'Creating Listing...' : 'Create Listing')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
} 