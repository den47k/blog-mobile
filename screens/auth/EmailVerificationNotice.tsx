import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";
import echo from "../../lib/echo";

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
    console.log(channel);

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
    <SafeAreaView>
      <View
        style={{
          padding: 20,
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <Text>✉️</Text>
        <Text>Verify Your Email</Text>
        <Text>A verification link has been sent to:</Text>
        <Text>{user?.email}</Text>
        <Text>
          Please check your inbox and click the link to activate your account.
        </Text>

        {message ? <Text>{message}</Text> : null}

        <TouchableOpacity onPress={handleResend} disabled={isSending}>
          {isSending ? (
            <ActivityIndicator />
          ) : (
            <Text>Resend Verification Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout}>
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
