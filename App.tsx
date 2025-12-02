import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginScreen from "@/screens/auth/LoginScreen";
import RegisterScreen from "@/screens/auth/RegisterScreen";
import EmailVerificationNoticeScreen from "@/screens/auth/EmailVerificationNotice";
import { RootStackParamList } from "./types/navigation";
import ConversationListScreen from "./screens/chat/ConversationListScreen";
import ConversationScreen from "./screens/chat/ConversationScreen";
import UserSearchScreen from "./screens/chat/UserSearchScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
        <>
          <Stack.Screen
            name="ConversationList"
            component={ConversationListScreen}
            options={{ headerShown: true, headerTitle: () => null }}
          />
          <Stack.Screen
            name="Conversation"
            component={ConversationScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen name="UserSearch" component={UserSearchScreen} />
        </>
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
