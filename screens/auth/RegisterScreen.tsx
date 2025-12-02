import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import FormTextField from "@/components/FormTextField";
import { useContext, useState } from "react";
import { isAxiosError } from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationContext } from "@react-navigation/native";
import { MessageCircle } from "lucide-react-native";

type RegisterErrors = {
  username?: string[];
  tag?: string[];
  email?: string[];
  password?: string[];
  password_confiramtion?: string[];
};

export default function RegisterScreen() {
  const navigation = useContext(NavigationContext);
  const { register: registerUser } = useAuth();
  const [username, setUsername] = useState("");
  const [tag, setTag] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    setErrors({});
    setIsSubmitting(true);

    try {
      await registerUser({
        username,
        tag,
        email,
        password,
      });

      navigation?.navigate("EmailVerificationNotice");
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 422) {
        setErrors(e.response.data.errors);
      } else {
        console.error("Register error:", e);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <MessageCircle size={48} color="#fff" strokeWidth={2} />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join us and start chatting</Text>
            </View>

            <View style={styles.formCard}>
              <FormTextField
                label="Username"
                value={username}
                onChangeText={setUsername}
                errors={errors.username ?? []}
                editable={!isSubmitting}
                placeholder="Choose a username"
              />
              <FormTextField
                label="Tag"
                value={tag}
                onChangeText={setTag}
                errors={errors.tag ?? []}
                editable={!isSubmitting}
                placeholder="e.g., developer, designer"
              />
              <FormTextField
                label="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                errors={errors.email ?? []}
                editable={!isSubmitting}
                placeholder="Enter your email"
              />
              <FormTextField
                label="Password"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
                errors={errors.password ?? []}
                editable={!isSubmitting}
                placeholder="Create a password"
              />
              <FormTextField
                label="Password confirmation"
                secureTextEntry={true}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                errors={errors.password_confiramtion ?? []}
                editable={!isSubmitting}
                placeholder="Confirm your password"
              />

              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#667eea" />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleRegister}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>Create Account</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation?.navigate("Login")}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Already have an account? Sign in
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  wrapper: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    gap: 16,
  },
  loadingContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#667eea",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
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
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryButtonText: {
    color: "#667eea",
    fontSize: 16,
    fontWeight: "600",
  },
});
