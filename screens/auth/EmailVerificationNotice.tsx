import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, RefreshCw, LogOut } from "lucide-react-native";
import echo from "@/lib/echo";

export default function EmailVerificationNoticeScreen() {
  const { user, setUser, logout, resendVerification } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || user.isEmailVerified) return;

    const channel = echo.private(`user.${user.id}`);
    channel.listen(".EmailVerified", (e: any) => {
      setUser({ ...user, isEmailVerified: !!e.user?.email_verified_at });
    });

    return () => {
      channel.stopListening(".EmailVerified");
    };
  }, [user]);

  const handleResend = async () => {
    setIsSending(true);
    setMessage("");

    try {
      await resendVerification();
      setMessage("Verification email has been resent.");
    } catch (err) {
      setMessage("Failed to resend verification email.");
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Mail size={64} color="#fff" strokeWidth={1.5} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.description}>
              A verification link has been sent to:
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.instructions}>
              Please check your inbox and click the link to activate your
              account.
            </Text>

            {message ? (
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{message}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleResend}
              disabled={isSending}
              style={[styles.primaryButton, isSending && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <RefreshCw
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>
                    Resend Verification Email
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <LogOut size={20} color="#667eea" style={{ marginRight: 8 }} />
              <Text style={styles.secondaryButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  wrapper: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 8,
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    color: "#667eea",
    marginBottom: 16,
    textAlign: "center",
  },
  instructions: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  messageContainer: {
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  messageText: {
    color: "#15803d",
    textAlign: "center",
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: "#667eea",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: "100%",
    marginBottom: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryButtonText: {
    color: "#667eea",
    fontSize: 16,
    fontWeight: "600",
  },
});
