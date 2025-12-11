import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LogOut, UserPlus } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import type { RootStackParamList } from "@/types/navigation";

import UserAvatar from "@/components/UserAvatar";
import {
  useConversationIds,
  useConversations as useConversationsMap,
} from "@/stores/chat.store";
import type { Conversation } from "@/types";
import { fetchConversations } from "@/services/ConversationService";
import { formatChatTime } from "@/lib/utils";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function getOtherParticipant(
  convo: Conversation,
  currentUserId?: string | null,
) {
  if (!currentUserId) return null;
  return (
    convo.participants.find((p) => String(p.id) !== String(currentUserId)) ??
    null
  );
}

function conversationTitle(convo: Conversation, currentUserId?: string | null) {
  const other = getOtherParticipant(convo, currentUserId);
  if (other) return other.name;
  return convo.title || "Conversation";
}

function conversationTag(convo: Conversation, currentUserId?: string | null) {
  const other = getOtherParticipant(convo, currentUserId);
  return convo.userTag ?? other?.tag ?? "";
}

function conversationAvatarSmall(
  convo: Conversation,
  currentUserId?: string | null,
) {
  const other = getOtherParticipant(convo, currentUserId);
  return convo.avatar?.small ?? other?.avatar?.small ?? null;
}

export default function ConversationListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { logout, user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // store to array in correct display order
  const ids = useConversationIds();
  const map = useConversationsMap();
  const conversations = useMemo(
    () => ids.map((id) => map[id]).filter(Boolean) as Conversation[],
    [ids, map],
  );

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((c) => {
      const title = conversationTitle(c, user?.id).toLowerCase();
      const tag = conversationTag(c, user?.id).toLowerCase();
      const last = (c.lastMessage?.content ?? "").toLowerCase();

      return title.includes(q) || tag.includes(q) || last.includes(q);
    });
  }, [conversations, searchQuery, user?.id]);

  async function loadConversations() {
    const res = await fetchConversations();
    if (!res.success) console.error("fetchConversations failed:", res.error);
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!user) return;
        await loadConversations();
      } finally {
        if (mounted) setIsBootLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadConversations();
    } finally {
      setIsRefreshing(false);
    }
  };

  const applyHeaderOptions = useCallback(() => {
    console.log(user);
    navigation.setOptions({
      headerStyle: { backgroundColor: "#fff" },
      headerShadowVisible: true,
      headerLeft: () => (
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Profile")}
          >
            <UserAvatar
              uri={user?.avatar?.small}
              name={user?.name}
              size={36}
              style={styles.profileBtn}
            />
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || "Guest"}</Text>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate("UserSearch")}
            style={styles.iconBtn}
          >
            <UserPlus size={22} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.iconBtn}>
            <LogOut size={22} color="#64748b" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [logout, navigation, user?.avatar?.small, user?.name]);

  useEffect(() => {
    applyHeaderOptions();
    const unsubscribe = navigation.addListener("focus", applyHeaderOptions);
    return unsubscribe;
  }, [applyHeaderOptions, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations or tags..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
          selectionColor="#667eea"
        />
      </View>

      {isBootLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const title = conversationTitle(item, user?.id);
            const tag = conversationTag(item, user?.id);
            const time = formatChatTime(
              item.lastMessage?.createdAt ?? item.updatedAt,
            );
            const lastMessage =
              item.lastMessage?.content?.trim() ||
              (item.lastMessage?.attachment?.urls?.original
                ? "?? Attachment"
                : "") ||
              "No messages yet";

            return (
              <TouchableOpacity
                style={styles.chatItem}
                onPress={() =>
                  navigation.navigate("Conversation", {
                    conversationId: item.id,
                    userName: user?.tag ?? "",
                  })
                }
                activeOpacity={0.7}
              >
                <UserAvatar
                  uri={conversationAvatarSmall(item, user?.id)}
                  name={title}
                  size={56}
                  badgeColor={item.hasUnread ? "#22c55e" : undefined}
                  style={styles.avatar}
                />

                <View style={styles.chatInfo}>
                  <View style={styles.row}>
                    <Text style={styles.name} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={styles.time}>{time}</Text>
                  </View>

                  <Text style={styles.lastMsg} numberOfLines={1}>
                    {lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No conversations found</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    gap: 4,
  },
  iconBtn: { padding: 8, borderRadius: 8 },
  userName: { fontSize: 16, fontWeight: "600", color: "#1e293b" },

  searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
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

  listContent: { paddingBottom: 16 },

  chatItem: {
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
  chatInfo: { flex: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 12,
  },
  name: { flex: 1, fontSize: 16, fontWeight: "600", color: "#1e293b" },
  time: { fontSize: 12, color: "#94a3b8" },
  lastMsg: { fontSize: 14, color: "#64748b", marginBottom: 6 },

  tagContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: { fontSize: 11, color: "#7c3aed", fontWeight: "600" },

  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: { padding: 40, alignItems: "center" },
  emptyText: { color: "#94a3b8", fontSize: 16 },
});
