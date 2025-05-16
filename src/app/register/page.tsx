'use client';

import { Container, Title, TextInput, PasswordInput, Button, Paper, Text, Anchor, Stack, Select, Textarea, FileInput, Image as MantineImage, Group as MantineGroup, ActionIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { IconPhoto, IconX, IconUpload } from '@tabler/icons-react';
import { getCities, getDistrictsByCityCode } from 'turkey-neighbourhoods';

// Define City type locally based on library's expected structure
interface City { 
  code: string;
  name: string; 
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  city: string | null;
  district: string | null;
  address: string;
  phoneNumber: string;
  profileImage: string;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const router = useRouter();

  const [allCitiesData, setAllCitiesData] = useState<City[]>([]);
  const [cityOptions, setCityOptions] = useState<{ label: string; value: string }[]>([]);
  const [districtOptions, setDistrictOptions] = useState<{ label: string; value: string }[]>([]);

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const cities: City[] = getCities();
    setAllCitiesData(cities);
    setCityOptions(cities.map((city: City) => ({ label: city.name, value: city.name })));
  }, []);

  const form = useForm<RegisterForm>({
    initialValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      city: null,
      district: null,
      address: '',
      phoneNumber: '',
      profileImage: '',
    },
    validate: {
      username: (value) => (value.trim().length < 3 ? 'Username must be at least 3 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      firstName: (value) => (value.trim().length < 2 ? 'First name must be at least 2 characters' : null),
      lastName: (value) => (value.trim().length < 2 ? 'Last name must be at least 2 characters' : null),
      city: (value) => (value === null ? 'City must be selected' : null),
      district: (value) => (value === null ? 'District must be selected' : null),
      address: (value) => (value.trim().length < 5 ? 'Address must be at least 5 characters' : null),
      phoneNumber: (value) => (/^\+?[0-9\s-()]{7,20}$/.test(value) ? null : 'Invalid phone number format'),
    },
  });

  useEffect(() => {
    if (form.values.city && allCitiesData.length > 0) {
      const selectedCity = allCitiesData.find(c => c.name === form.values.city);
      if (selectedCity) {
        const districts: string[] = getDistrictsByCityCode(selectedCity.code);
        setDistrictOptions(districts.map((district: string) => ({ label: district, value: district })));
      } else {
        setDistrictOptions([]);
      }
    } else {
      setDistrictOptions([]);
    }
  }, [form.values.city, allCitiesData]);

  const handleProfileImageChange = (file: File | null) => {
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setFieldValue('profileImage', '');
    } else {
      setProfileImageFile(null);
      setProfileImagePreview(null);
      form.setFieldValue('profileImage', '');
    }
  };

  const removeProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    form.setFieldValue('profileImage', '');
  };

  const handleSubmit = async (values: RegisterForm) => {
    setLoading(true);
    let uploadedProfileImageUrl = values.profileImage;

    if (profileImageFile) {
      try {
        setIsUploadingProfileImage(true);
        const formData = new FormData();
        formData.append('file', profileImageFile);

        const uploadResponse = await fetch('/api/user/upload-profile-image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload profile image');
        }

        uploadedProfileImageUrl = await uploadResponse.text();
        notifications.show({ title: 'Uploaded', message: 'Profile image uploaded successfully.', color: 'green' });
      } catch (err: any) {
        notifications.show({ title: 'Upload Failed', message: err.message || 'Profile image upload failed.', color: 'red' });
        setIsUploadingProfileImage(false);
        setLoading(false);
        return;
      } finally {
        setIsUploadingProfileImage(false);
      }
    }

    const submissionValues = {
      ...values,
      profileImage: uploadedProfileImageUrl || '',
    };

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionValues),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      notifications.show({ title: 'Success', message: 'Account created successfully!', color: 'green' });
      router.push('/login');
    } catch (error: any) {
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={460} my={40}>
      <Title ta="center" fw={900}>Create an account</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Already have an account?{' '}
        <Anchor component={Link} href="/login" size="sm">Sign in</Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput label="Username" placeholder="Your username" required {...form.getInputProps('username')} />
            <TextInput label="Email" placeholder="you@example.com" required {...form.getInputProps('email')} />
            <PasswordInput label="Password" placeholder="Your password" required {...form.getInputProps('password')} />
            <TextInput label="First Name" placeholder="Your first name" required {...form.getInputProps('firstName')} />
            <TextInput label="Last Name" placeholder="Your last name" required {...form.getInputProps('lastName')} />
            <Select label="City" placeholder="Select your city" data={cityOptions} required {...form.getInputProps('city')} onChange={(value) => { form.setFieldValue('city', value); form.setFieldValue('district', null); }} searchable />
            <Select label="District" placeholder="Select your district" data={districtOptions} required disabled={!form.values.city || districtOptions.length === 0} {...form.getInputProps('district')} searchable />
            <Textarea label="Address" placeholder="Your full address" required minRows={2} {...form.getInputProps('address')} />
            <TextInput label="Phone Number" placeholder="+90 555 123 4567" required {...form.getInputProps('phoneNumber')} />
            <FileInput label="Profile Image (Optional)" placeholder={profileImageFile ? profileImageFile.name : 'Choose an image'} accept="image/png,image/jpeg,image/webp" onChange={handleProfileImageChange} leftSection={<IconPhoto size={18} />} value={profileImageFile} />
            {profileImagePreview && (
              <MantineGroup justify="center" mt="xs" style={{ position: 'relative' }}>
                <MantineImage src={profileImagePreview} alt="Profile Preview" width={120} height={120} radius="md" />
                <ActionIcon color="red" variant="filled" onClick={removeProfileImage} style={{ position: 'absolute', top: 0, right: 'calc(50% - 70px)' }} title="Remove image" size="sm">
                  <IconX size={14} />
                </ActionIcon>
              </MantineGroup>
            )}
          </Stack>

          <Button fullWidth mt="xl" type="submit" loading={loading || isUploadingProfileImage} leftSection={<IconUpload size={18} />}>
            {isUploadingProfileImage ? 'Uploading Image...' : (loading ? 'Registering...' : 'Register')}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
