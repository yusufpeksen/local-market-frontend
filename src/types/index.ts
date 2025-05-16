export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  district: string;
  address: string;
  phoneNumber: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  imageUrls?: string[];
  userId: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  listingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ListingCreateRequest {
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
}

export interface ListingUpdateRequest {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  images?: string[];
}

export interface ListingSearchRequest {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  city?: string;
  district?: string;
  address?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
} 