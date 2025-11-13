import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/auth/LoginScreen";
import ChatScreen from "./screens/ChatScreen";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";
import RegisterScreen from "./screens/auth/RegisterScreen";
import EmailVerificationNoticeScreen from "./screens/auth/EmailVerificationNotice";

const Stack = createNativeStackNavigator();

function Navigation() {
  const { isAuthenticated, isVerified, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Create account" component={RegisterScreen} />
        </>
      ) : !isVerified ? (
        <Stack.Screen
          name="EmailVerificationNotice"
          component={EmailVerificationNoticeScreen}
          options={{ gestureEnabled: false }}
        />
      ) : (
        <Stack.Screen name="Chat" component={ChatScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
