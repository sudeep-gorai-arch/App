import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import * as SecureStore from 'expo-secure-store';

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import API from '../services/api';

import { googleLogin } from '../services/authService';

export type Role = {
  id: string;
  name: string;
};

export type User = {
  id: string;

  username: string;

  email: string;

  avatarUrl?: string | null;

  bio?: string | null;

  isPremium: boolean;

  role?: Role | null;
};

type AuthContextType = {
  user: User | null;

  token: string | null;

  loading: boolean;

  authLoading: boolean;

  isLoggedIn: boolean;

  signInGoogle: () => Promise<void>;

  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',

      offlineAccess: false,
    });

    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const savedToken = await SecureStore.getItemAsync('token');

      const savedUser = await SecureStore.getItemAsync('user');

      if (savedToken && savedUser) {
        API.defaults.headers.common.Authorization = `Bearer ${savedToken}`;

        setToken(savedToken);

        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      await SecureStore.deleteItemAsync('token');

      await SecureStore.deleteItemAsync('user');
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (
    jwt: string,

    profile: User,
  ) => {
    await SecureStore.setItemAsync('token', jwt);

    await SecureStore.setItemAsync(
      'user',

      JSON.stringify(profile),
    );

    API.defaults.headers.common.Authorization = `Bearer ${jwt}`;

    setToken(jwt);

    setUser(profile);
  };

  const signInGoogle = async () => {
    setAuthLoading(true);

    try {
      await GoogleSignin.hasPlayServices();

      const result = await GoogleSignin.signIn();

      const idToken = result.data?.idToken;

      if (!idToken) {
        throw new Error('Google token missing');
      }

      const response = await googleLogin(idToken);

      await saveSession(
        response.data.token,

        response.data.user,
      );
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        console.log('GOOGLE ERROR', error);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await API.post('/auth/logout');
      }
    } catch (e) {}

    await SecureStore.deleteItemAsync('token');

    await SecureStore.deleteItemAsync('user');

    await GoogleSignin.signOut().catch(() => {});

    delete API.defaults.headers.common.Authorization;

    setToken(null);

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,

        token,

        loading,

        authLoading,

        isLoggedIn: !!user,

        signInGoogle,

        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
