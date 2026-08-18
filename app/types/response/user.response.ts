export type RoleResponse = {
  id?: number | string;
  roleCode?: string;
  name: string;
  description?: string;
};

export type UserResponse = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles?: RoleResponse[];
};

export type User = UserResponse;
export type Role = RoleResponse;
