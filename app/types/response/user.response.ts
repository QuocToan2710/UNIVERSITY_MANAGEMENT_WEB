export type Permission = {
  id?: number | string;
  permissionCode?: string;
  name: string;
  description?: string;
  module?: string;
  endpoint?: string;
  method?: string;
};

export type RoleResponse = {
  id?: number | string;
  roleCode?: string;
  name: string;
  description?: string;
  permissions?: Permission[];
};

export type UserResponse = {
  id: number | string;
  userCode?: string;
  username: string;
  email: string;
  fullName: string;
  roles?: RoleResponse[];
};

export type User = UserResponse;
export type Role = RoleResponse;

