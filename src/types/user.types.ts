export type UserProfile = {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
};

export type UpdateProfilePayload = {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};