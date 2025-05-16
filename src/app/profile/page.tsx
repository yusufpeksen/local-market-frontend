'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Title, TextInput, PasswordInput, Button, Paper, Text, Stack, Select, Textarea, FileInput, Image as MantineImage, Group, ActionIcon, Tabs, Avatar } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { IconPhoto, IconX, IconUpload, IconUserEdit, IconLock } from '@tabler/icons-react';
import api from '@/services/api';
import { User, UserUpdateRequest, ChangePasswordRequest as ChangePasswordRequestDTO } from '@/types';
import { getCities, getDistrictsByCityCode } from 'turkey-neighbourhoods';

interface City { 
  code: string;
  name: string; 
}

interface PasswordFormFields extends ChangePasswordRequestDTO {
  confirmNewPassword?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [allCitiesData, setAllCitiesData] = useState<City[]>([]);
  const [cityOptions, setCityOptions] = useState<{ label: string; value: string }[]>([]);
  const [districtOptions, setDistrictOptions] = useState<{ label: string; value: string }[]>([]);
  
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  // Fetch all cities on component mount
  useEffect(() => {
    const citiesData: City[] = getCities();
    setAllCitiesData(citiesData);
    setCityOptions(citiesData.map((city: City) => ({ label: city.name, value: city.name })));
  }, []);

  const profileForm = useForm<UserUpdateRequest & { email?: string; username?: string }>({ 
    initialValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      city: '',
      district: '',
      address: '',
      phoneNumber: '',
      profileImage: '',
    },
    validate: {
      firstName: (value) => (value && value.trim().length < 2 ? 'First name must be at least 2 characters' : null),
      lastName: (value) => (value && value.trim().length < 2 ? 'Last name must be at least 2 characters' : null),
      address: (value) => (value && value.trim().length > 0 && value.trim().length < 5 ? 'Address must be at least 5 characters' : null),
      phoneNumber: (value) => (value && !/^\+?[0-9\s-()]{7,20}$/.test(value) ? 'Invalid phone number format' : null),
    },
  });

  const passwordForm = useForm<PasswordFormFields>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    validate: {
      currentPassword: (value) => (!value || value.length < 1 ? 'Current password is required' : null),
      newPassword: (value) => (!value || value.length < 6 ? 'New password must be at least 6 characters' : null),
      confirmNewPassword: (value: string | undefined, values: PasswordFormFields) => 
        (values.newPassword && value !== values.newPassword ? 'Passwords do not match' : null),
    },
  });

  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      notifications.show({ title: 'Error', message: 'You are not logged in.', color: 'red' });
      router.push('/login');
      return;
    }
    try {
      const user: User = JSON.parse(storedUser);
      const response = await api.get(`api/user/profile/${user.id}`, { 
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData: User = response.data;
      setCurrentUser(userData);
      profileForm.setValues({
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        city: userData.city || '',
        district: userData.district || '',
        address: userData.address || '',
        phoneNumber: userData.phoneNumber || '',
        profileImage: userData.profileImage || '',
      });
      if (userData.profileImage) {
        setProfileImagePreview(userData.profileImage);
      }
      if (userData.city && allCitiesData.length > 0) {
        const currentCityDetails = allCitiesData.find(c => c.name === userData.city);
        if (currentCityDetails) {
          const districts: string[] = getDistrictsByCityCode(currentCityDetails.code);
          setDistrictOptions(districts.map((d: string) => ({ label: d, value: d })));
          profileForm.setFieldValue('district', userData.district || '');
        }
      }
    } catch (error: any) {
      notifications.show({ title: 'Error fetching profile', message: error.message || 'Could not load user data.', color: 'red' });
    }
  }, [router, allCitiesData]);

  useEffect(() => {
    if (allCitiesData.length > 0) {
        fetchUserProfile();
    }
  }, [fetchUserProfile, allCitiesData]);

  // Effect to update district options when city changes in profile form
  useEffect(() => {
    const selectedCityName = profileForm.values.city;
    if (selectedCityName && allCitiesData.length > 0) {
      const cityDetails = allCitiesData.find(c => c.name === selectedCityName);
      if (cityDetails) {
        const districts: string[] = getDistrictsByCityCode(cityDetails.code);
        setDistrictOptions(districts.map((d: string) => ({ label: d, value: d })));
      } else {
        setDistrictOptions([]);
      }
    } else {
      setDistrictOptions([]);
    }
  }, [profileForm.values.city, allCitiesData]);

  const handleProfileImageChange = (file: File | null) => {
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProfileImageFile(null);
      setProfileImagePreview(currentUser?.profileImage || null);
    }
  };

  const removeProfileImagePreview = () => {
    setProfileImageFile(null);
    setProfileImagePreview(currentUser?.profileImage || null);
  };

  const handleProfileUpdate = async (values: UserUpdateRequest & { email?: string; username?: string }) => {
    if (!currentUser) return;
    setLoading(true);
    let finalProfileImageUrl = profileForm.values.profileImage || currentUser.profileImage || '';
    let imageWasUploaded = false;

    if (profileImageFile) {
      setIsUploadingProfileImage(true);
      const formData = new FormData();
      formData.append('file', profileImageFile);
      const token = localStorage.getItem('token');
      const userId = currentUser.id;

      try {
        const response = await api.post(`api/user/upload-profile-image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-User-Id': userId, 
            Authorization: `Bearer ${token}` 
          },
        });
        finalProfileImageUrl = `${response.data}?timestamp=${new Date().getTime()}`;
        imageWasUploaded = true;
        
      } catch (error: any) {
        notifications.show({ title: 'Profile Image Upload Error', message: error.message || 'Failed to upload new image.', color: 'red' });
        setIsUploadingProfileImage(false);
        setLoading(false);
        return;
      } finally {
        setIsUploadingProfileImage(false);
      }
    }

    const updatePayload: UserUpdateRequest = {
      firstName: values.firstName,
      lastName: values.lastName,
      city: values.city,
      district: values.district,
      address: values.address,
      phoneNumber: values.phoneNumber,
      profileImage: imageWasUploaded ? finalProfileImageUrl : (values.profileImage || currentUser.profileImage || ''),
    };

    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`api/user/profile/${currentUser.id}`, updatePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let updatedUserData: User = response.data;

      let effectiveProfileImageUrl = updatedUserData.profileImage || '';
      if (imageWasUploaded) {
        effectiveProfileImageUrl = finalProfileImageUrl;
      } else if (effectiveProfileImageUrl && !effectiveProfileImageUrl.includes('timestamp=')) {
        effectiveProfileImageUrl = `${effectiveProfileImageUrl}?timestamp=${new Date().getTime()}`;
      }
      updatedUserData = { ...updatedUserData, profileImage: effectiveProfileImageUrl };

      notifications.show({ title: 'Success', message: 'Profile updated successfully!', color: 'green' });
      
      setCurrentUser(updatedUserData);
      setProfileImagePreview(effectiveProfileImageUrl);
      profileForm.setValues({
        ...profileForm.values, 
        firstName: updatedUserData.firstName || '',
        lastName: updatedUserData.lastName || '',
        city: updatedUserData.city || '',
        district: updatedUserData.district || '',
        address: updatedUserData.address || '',
        phoneNumber: updatedUserData.phoneNumber || '',
        profileImage: effectiveProfileImageUrl,
      });
      
      const storedUser = localStorage.getItem('user');
      if(storedUser) {
          const user = JSON.parse(storedUser);
          const comprehensiveUpdate = { 
              ...user, 
              firstName: updatedUserData.firstName,
              lastName: updatedUserData.lastName,
              city: updatedUserData.city,
              district: updatedUserData.district,
              address: updatedUserData.address,
              phoneNumber: updatedUserData.phoneNumber,
              profileImage: effectiveProfileImageUrl
            };
          localStorage.setItem('user', JSON.stringify(comprehensiveUpdate));
          window.dispatchEvent(new Event("storage"));
      }
      setProfileImageFile(null);
      router.refresh();

    } catch (error: any) {
      notifications.show({ title: 'Error', message: error.message || 'Failed to update profile.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: PasswordFormFields) => {
    if (!currentUser || !values.currentPassword || !values.newPassword) {
        notifications.show({title: "Input Error", message: "Please fill all password fields.", color: "yellow"});
        return;
    };
    setLoading(true);
    const payload: ChangePasswordRequestDTO = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
    };
    try {
      const token = localStorage.getItem('token');
      await api.post(`/user/change-password/${currentUser.id}`, payload , {
        headers: { Authorization: `Bearer ${token}` },
      });
      notifications.show({ title: 'Success', message: 'Password changed successfully!', color: 'green' });
      passwordForm.reset();
    } catch (error: any) {
      notifications.show({ title: 'Error', message: error.response?.data || error.message || 'Failed to change password.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <Container><Text>Loading profile...</Text></Container>;
  }

  return (
    <Container size="md" my={40}>
      <Title ta="center" fw={900} mb="xl">
        My Profile
      </Title>

      <Tabs defaultValue="details">
        <Tabs.List grow>
          <Tabs.Tab value="details" leftSection={<IconUserEdit size={18} />}>
            Edit Details
          </Tabs.Tab>
          <Tabs.Tab value="password" leftSection={<IconLock size={18} />}>
            Change Password
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="lg">
          <Paper withBorder shadow="md" p={30} radius="md">
            <form onSubmit={profileForm.onSubmit(handleProfileUpdate)}>
              <Stack gap="lg">
                <Group justify="center" mb="md">
                  <Avatar src={profileImagePreview || undefined} size={120} radius="50%" alt="Profile image preview" />
                </Group>
                
                <FileInput
                  label="Change Profile Image"
                  placeholder={profileImageFile ? profileImageFile.name : "Choose new image"}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleProfileImageChange}
                  leftSection={<IconPhoto size={18} />}
                  value={profileImageFile}
                />
                {profileImagePreview && profileImageFile && (
                  <Group justify="center" mt="xs" style={{ position: 'relative', width: 120, margin: 'auto' }}>
                    <MantineImage
                      src={profileImagePreview}
                      alt="New profile preview"
                      w={120}
                      h={120}
                      radius="md"
                    />
                    <ActionIcon 
                      color="red" 
                      variant="filled" 
                      onClick={removeProfileImagePreview} 
                      style={{position: 'absolute', top: 5, right: 5}}
                      title="Cancel new image"
                      size="sm"
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  </Group>
                )}

                <TextInput label="Username" disabled {...profileForm.getInputProps('username')} />
                <TextInput label="Email"    disabled {...profileForm.getInputProps('email')} />
                <TextInput label="First Name" placeholder="Your first name" {...profileForm.getInputProps('firstName')} />
                <TextInput label="Last Name" placeholder="Your last name" {...profileForm.getInputProps('lastName')} />
                <Select
                  label="City"
                  placeholder="Select your city"
                  data={cityOptions}
                  clearable
                  searchable
                  {...profileForm.getInputProps('city')}
                   onChange={(value) => {
                    profileForm.setFieldValue('city', value || '');
                    profileForm.setFieldValue('district', ''); 
                  }}
                />
                <Select
                  label="District"
                  placeholder="Select your district"
                  data={districtOptions}
                  disabled={!profileForm.values.city || districtOptions.length === 0}
                  clearable
                  searchable
                  {...profileForm.getInputProps('district')}
                />
                <Textarea label="Address" placeholder="Your full address" minRows={2} {...profileForm.getInputProps('address')} />
                <TextInput label="Phone Number" placeholder="+90 555 123 4567" {...profileForm.getInputProps('phoneNumber')} />
                <Button type="submit" loading={loading || isUploadingProfileImage} leftSection={<IconUpload size={18}/>}>
                  {isUploadingProfileImage ? 'Uploading Image...' : (loading ? 'Saving...' : 'Save Changes')}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="password" pt="lg">
          <Paper withBorder shadow="md" p={30} radius="md">
            <form onSubmit={passwordForm.onSubmit(handleChangePassword)}>
              <Stack gap="lg">
                <PasswordInput label="Current Password" placeholder="Your current password" required {...passwordForm.getInputProps('currentPassword')} />
                <PasswordInput label="New Password" placeholder="Your new password" required {...passwordForm.getInputProps('newPassword')} />
                <PasswordInput label="Confirm New Password" placeholder="Confirm your new password" required {...passwordForm.getInputProps('confirmNewPassword')} />
                <Button type="submit" loading={loading} leftSection={<IconLock size={18}/>}>
                  Change Password
                </Button>
              </Stack>
            </form>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
} 