import { View, StyleSheet, Button, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FormTextField from "../../components/FormTextField";
import { useContext, useState } from "react";
import { isAxiosError } from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { NavigationContext } from "@react-navigation/native";
import { register } from "../../services/AuthService";

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
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <FormTextField
          label="Username:"
          value={username}
          onChangeText={setUsername}
          errors={errors.username ?? []}
          editable={!isSubmitting}
        />
        <FormTextField
          label="Tag:"
          value={tag}
          onChangeText={setTag}
          errors={errors.tag ?? []}
          editable={!isSubmitting}
        />
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
        <FormTextField
          label="Password confiramtion:"
          secureTextEntry={true}
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          errors={errors.password_confiramtion ?? []}
          editable={!isSubmitting}
        />
        {isSubmitting ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <>
            <Button title="Create account" onPress={handleRegister} />
            <Button
              title="Sign in"
              onPress={() => navigation?.navigate("Login")}
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
