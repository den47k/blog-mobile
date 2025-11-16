import { View, StyleSheet, Button, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FormTextField from "@/components/FormTextField";
import { useContext, useState } from "react";
import { isAxiosError } from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationContext } from "@react-navigation/native";

type LoginErrors = {
  email?: string[];
  password?: string[];
};

export default function LoginScreen() {
  const navigation = useContext(NavigationContext);
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setErrors({});
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 422) {
        setErrors(e.response.data.errors);
      } else {
        console.error("Login error:", e);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <FormTextField
          label="Email address:"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          errors={errors.email ?? []}
          editable={!isSubmitting}
        />
        <FormTextField
          label="Password:"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
          errors={errors.password ?? []}
          editable={!isSubmitting}
        />
        {isSubmitting ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <>
            <Button title="Login" onPress={handleLogin} />
            <Button
              title="Create an account"
              onPress={() => navigation?.navigate("Create account")}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: "#fff", flex: 1 },
  container: { padding: 20, rowGap: 16 },
});
