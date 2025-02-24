export interface IUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserInput {
  email: string;
  password: string;
  name: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface GoogleAuthResponse {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleProfile {
  sub: string; // Google's unique identifier
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}
