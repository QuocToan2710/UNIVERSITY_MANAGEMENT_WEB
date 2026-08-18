export type LoginRequest = {
  username: string;
  password: string;
};

export type LogoutRequest = {
  token: string;
};

export type IntrospectRequest = {
  token: string;
};

export type RefreshRequest = {
  token: string;
};

export type ChangePasswordRequest = {
  oldPassword?: string;
  newPassword: string;
  confirmPassword?: string;
};
