import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search, ArrowLeft } from "lucide-react-native";
import type { RootStackParamList } from "@/types/navigation";
import { LinearGradient } from "expo-linear-gradient";

interface SearchUser {
  id: string;
  name: string;
  tag: string;
  bio?: string;
}

const MOCK_USERS: SearchUser[] = [
  {
    id: "4",
    name: "Emma Wilson",
    tag: "developer",
    bio: "Full-stack developer",
  },
  {
    id: "5",
    name: "David Chen",
    tag: "designer",
    bio: "UI/UX enthusiast",
  },
  {
    id: "6",
    name: "Sarah Johnson",
    tag: "manager",
    bio: "Product manager at Tech Co",
  },
  {
    id: "7",
    name: "Mike Brown",
    tag: "developer",
    bio: "Backend specialist",
  },
  {
    id: "8",
    name: "Lisa Martinez",
    tag: "designer",
    bio: "Creative director",
  },
];

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UserSearch"
>;

export default function UserSearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.tag.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getGradientColors = (name: string): [string, string] => {
    const gradients: [string, string][] = [
      ["#667eea", "#764ba2"],
      ["#f093fb", "#f5576c"],
      ["#4facfe", "#00f2fe"],
      ["#43e97b", "#38f9d7"],
      ["#fa709a", "#fee140"],
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const handleStartChat = (user: SearchUser) => {
    navigation.navigate("Conversation", {
      userId: user.id,
      userName: user.name,
    });
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
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleStartChat(item)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={getGradientColors(item.name)}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </LinearGradient>
            <View style={styles.userInfo}>
              <Text style={styles.name}>{item.name}</Text>
              {item.bio && (
                <Text style={styles.bio} numberOfLines={1}>
                  {item.bio}
                </Text>
              )}
              <View style={styles.tagContainer}>
                <Text style={styles.tagText}>#{item.tag}</Text>
              </View>
            </View>
            <View style={styles.chatBtn}>
              <Text style={styles.chatBtnText}>Chat</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No users found"
                : "Start typing to search for users"}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
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
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
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
  bio: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 6,
  },
  tagContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
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
});
