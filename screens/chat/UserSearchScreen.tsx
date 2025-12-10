import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search, ArrowLeft } from "lucide-react-native";
import type { RootStackParamList } from "@/types/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { searchUsers } from "@/services/UserService";
import {
  createPrivateConversation,
  fetchConversations,
} from "@/services/ConversationService";
import type { Conversation, User } from "@/types";
import UserAvatar from "@/components/UserAvatar";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UserSearch"
>;

export default function UserSearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);

  useEffect(() => {
    const query = searchQuery.trim();
    let isActive = true;

    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return () => {
        isActive = false;
      };
    }

    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      const res = await searchUsers(query);
      if (!isActive) return;

      if (res.success) {
        const filtered = currentUser
          ? res.data.filter((u) => String(u.id) !== String(currentUser.id))
          : res.data;
        setSearchResults(filtered);
      } else {
        console.error("User search failed:", res.error);
        setSearchError("Could not fetch users. Try again.");
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 450);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUser?.id]);

  const handleStartChat = async (user: User) => {
    if (creatingFor) return;

    setCreatingFor(user.id);
    setSearchError(null);

    try {
      const res = await createPrivateConversation(user.id);
      if (!res.success) throw res.error;

      let conversationId: string | null = null;

      if (res.data !== true && (res.data as Conversation)?.id) {
        conversationId = String((res.data as Conversation).id);
      }

      if (!conversationId) {
        const convRes = await fetchConversations();
        if (convRes.success) {
          const match = convRes.data.find((convo) =>
            convo.participants.some(
              (participant) => String(participant.id) === String(user.id),
            ),
          );
          conversationId = match?.id ?? null;
        }
      }

      if (conversationId) {
        navigation.navigate("Conversation", {
          conversationId,
          userName: user.name,
        });
      } else {
        Alert.alert(
          "Conversation created",
          "We started the chat but couldn't open it automatically. Please try again from your conversations list.",
        );
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
      Alert.alert(
        "Unable to start chat",
        "Something went wrong while starting the conversation. Please try again.",
      );
    } finally {
      setCreatingFor(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Users</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or tag..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
          autoFocus
          selectionColor="#667eea"
        />
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleStartChat(item)}
            activeOpacity={0.7}
            disabled={!!creatingFor}
          >
            <UserAvatar
              uri={item.avatar?.small}
              name={item.name}
              size={56}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.tagText}>@{item.tag}</Text>
            </View>
            <View style={styles.chatBtn}>
              {creatingFor === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.chatBtnText}>Chat</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isSearching ? (
              <>
                <ActivityIndicator size="large" color="#94a3b8" />
                <Text style={styles.emptyText}>Searching...</Text>
              </>
            ) : searchError ? (
              <>
                <Text style={styles.emptyText}>{searchError}</Text>
                <Text style={styles.emptySubtext}>
                  Please try again in a moment.
                </Text>
              </>
            ) : searchQuery ? (
              <>
                <Search size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No users found</Text>
              </>
            ) : (
              <>
                <Search size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>
                  Start typing to search for users
                </Text>
              </>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: "#ffffff",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1e293b",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listContent: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  userItem: {
    flexDirection: "row",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#7c3aed",
    fontWeight: "600",
  },
  chatBtn: {
    backgroundColor: "#667eea",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chatBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#cbd5e1",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
});
