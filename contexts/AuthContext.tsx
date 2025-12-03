import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import { clearToken, getToken } from "@/services/TokenService";
import * as AuthService from "@/services/AuthService";
import { User } from "@/types";
import ChatEventService from "@/services/ChatEventService";

type AuthContextType = {
  user: User | null;
  setUser: (user: User) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resendVerification: () => Promise<void>;
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

  useEffect(() => {
    if (user?.id) {
      ChatEventService.start(String(user.id));
      return () => {
        ChatEventService.stop();
      };
    }

    ChatEventService.stop();
  }, [user?.id]);

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

  async function resendVerification() {
    if (!user?.email) {
      throw new Error("No user email found");
    }

    await AuthService.resendVerification(user.email);
  }

  const value: AuthContextType = {
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user,
    isVerified: !!user?.isEmailVerified,
    login,
    register,
    logout,
    refreshUser,
    resendVerification,
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
