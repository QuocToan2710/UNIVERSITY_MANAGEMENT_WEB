export type AuthenticationResponse = {
  token: string;
  authenticated: boolean;
};

export type IntrospectResponse = {
  valid: boolean;
};
