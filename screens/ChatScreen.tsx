import { View, Text, StyleSheet, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";

export default function ChatScreen() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome, {user?.name || user?.email}!
        </Text>

        <View style={styles.content}>
          <Text>Chat content goes here...</Text>
        </View>

        <Button title="Logout" onPress={handleLogout} color="#d32f2f" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
    flex: 1,
  },
  container: {
    padding: 20,
    flex: 1,
  },
  welcome: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
