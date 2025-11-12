import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import { clearToken, getToken } from "../services/TokenService";
import * as AuthService from "../services/AuthService";

export type User = {
  id: string;
  name: string;
  tag: string;
  email: string;
  avatar: {
    original: string;
    medium: string;
    small: string;
  } | null;
  isEmailVerified: boolean | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterCredentials = {
  username: string;
  tag: string;
  email: string;
  password: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function checkAuth() {
    try {
      const token = await getToken();
      if (token) {
        const userData = await AuthService.loadUser();
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      await clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function login(credentials: LoginCredentials) {
    const deviceName = `${Platform.OS} ${Platform.Version}`;
    await AuthService.login({ ...credentials, device_name: deviceName });
    const userData = await AuthService.loadUser();
    setUser(userData);
  }

  async function register(credentials: RegisterCredentials) {
    const deviceName = `${Platform.OS} ${Platform.Version}`;
    await AuthService.register({
      ...credentials,
      password_confirmation: credentials.password,
      device_name: deviceName,
    });
    const userData = await AuthService.loadUser();
    setUser(userData);
  }

  async function logout() {
    await AuthService.logout();
    setUser(null);
  }

  async function refreshUser() {
    const userData = await AuthService.loadUser();
    setUser(userData);
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
