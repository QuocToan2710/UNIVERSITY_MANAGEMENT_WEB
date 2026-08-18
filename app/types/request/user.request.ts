export type UserRequest = {
  id?: string;
  username: string;
  password?: string;
  email: string;
  fullName: string;
  roles?: string[];
};

export type UserPayload = UserRequest;

export const emptyUser: UserPayload = {
  username: '',
  password: '',
  email: '',
  fullName: '',
};
