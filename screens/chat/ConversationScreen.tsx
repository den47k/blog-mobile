import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Send } from "lucide-react-native";
import type { RootStackParamList } from "@/types/navigation";
import { useAuth } from "@/contexts/AuthContext";

import { useConversation as useConversationFromStore } from "@/stores/chat.store";
import type { Message as ApiMessage } from "@/types";
import echo from "@/lib/echo";
import {
  fetchMessagesByPage,
  fetchMessagesFirstPage,
  sendMessage as sendMessageSvc,
  updateMessage as updateMessageSvc,
  deleteMessage as deleteMessageSvc,
} from "@/services/MessageService";
import { markConversationAsRead } from "@/services/ConversationService";
import { useChatStore } from "@/stores/chat.store";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<RootStackParamList, "Conversation">;

type MessageListItem =
  | { type: "message"; id: string; message: ApiMessage }
  | { type: "date"; id: string; label: string };

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function titleFromConversation(convo: any, currentUserId?: string | null) {
  if (!convo) return "Conversation";
  const other =
    convo.participants?.find(
      (p: any) => String(p.id) !== String(currentUserId),
    ) ?? null;
  return other?.name ?? convo.title ?? "Conversation";
}

export default function ConversationScreen({ route, navigation }: Props) {
  const { conversationId } = route.params;
  const { user } = useAuth();

  const convo = useConversationFromStore(conversationId);

  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, last: 1 });

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [editingMessage, setEditingMessage] = useState<ApiMessage | null>(null);

  const updateConversationOnNewMessage = useChatStore(
    (state) => state.updateConversationOnNewMessage,
  );
  const updateConversationOnMessageUpdate = useChatStore(
    (state) => state.updateConversationOnMessageUpdate,
  );
  const updateConversationOnMessageDelete = useChatStore(
    (state) => state.updateConversationOnMessageDelete,
  );

  const title = useMemo(
    () => titleFromConversation(convo, user?.id ?? null),
    [convo, user?.id],
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }),
    [],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const formatDateLabel = useCallback(
    (date: Date) => {
      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const startOfDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const diffDays = Math.floor(
        (startOfToday.getTime() - startOfDate.getTime()) / DAY_IN_MS,
      );

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      return dateFormatter.format(date);
    },
    [dateFormatter],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerStyle: { backgroundColor: "#fff" },
      headerShadowVisible: true,
    });
  }, [navigation, title]);

  useFocusEffect(
    useCallback(() => {
      useChatStore.getState().setActiveConversation(conversationId);
      void markConversationAsRead(conversationId);

      // ✅ runs on blur AND on unmount (going back)
      return () => {
        useChatStore.getState().setActiveConversation(null);
      };
    }, [conversationId]),
  );

  // fetch messages (page 1)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        const res = await fetchMessagesFirstPage(conversationId);

        if (!mounted) return;

        if (res.success) {
          const page = res.data;
          setMessages(page.data);
          const current = page.meta?.current_page ?? 1;
          const last = page.meta?.last_page ?? current;
          setPagination({ current, last });
          setHasMore(current < last);
        } else {
          console.error("fetchMessagesFirstPage failed:", res.error);
          setMessages([]);
          setHasMore(false);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [conversationId]);

  useEffect(() => {
    setEditingMessage(null);
    setText("");
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const channel = echo.private(`conversation.${conversationId}`);

    const handleMessageCreated = (event: { message: ApiMessage }) => {
      const { message } = event;
      if (String(message.conversationId) !== String(conversationId)) return;

      updateConversationOnNewMessage(message, user.id);

      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === String(message.id))) {
          return prev;
        }
        return [message, ...prev];
      });

      if (String(message.senderId) !== String(user.id)) {
        void markConversationAsRead(conversationId);
      }
    };

    const handleMessageUpdated = (event: { message: ApiMessage }) => {
      const { message } = event;
      if (String(message.conversationId) !== String(conversationId)) return;

      updateConversationOnMessageUpdate(message);

      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(message.id) ? { ...m, ...message } : m,
        ),
      );
    };

    const handleMessageDeleted = (event: {
      conversationId: string;
      deletedId: string;
      wasLastMessage: boolean;
      newLastMessage: ApiMessage | null;
    }) => {
      const {
        conversationId: eventConversationId,
        deletedId,
        wasLastMessage,
        newLastMessage,
      } = event;

      updateConversationOnMessageDelete(
        eventConversationId,
        wasLastMessage,
        newLastMessage,
        false,
      );

      if (String(eventConversationId) !== String(conversationId)) {
        return;
      }

      setMessages((prev) =>
        prev.filter((m) => String(m.id) !== String(deletedId)),
      );

      setEditingMessage((currentEditing) => {
        if (currentEditing && String(currentEditing.id) === String(deletedId)) {
          setText("");
          return null;
        }
        return currentEditing;
      });
    };

    channel.listen(".MessageCreatedEvent", handleMessageCreated);
    channel.listen(".MessageUpdatedEvent", handleMessageUpdated);
    channel.listen(".MessageDeletedEvent", handleMessageDeleted);

    return () => {
      channel.stopListening(".MessageCreatedEvent", handleMessageCreated);
      channel.stopListening(".MessageUpdatedEvent", handleMessageUpdated);
      channel.stopListening(".MessageDeletedEvent", handleMessageDeleted);
      echo.leave(`conversation.${conversationId}`);
    };
  }, [conversationId, user?.id]);

  const loadOlderMessages = useCallback(async () => {
    if (isLoading || isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    try {
      const nextPage = pagination.current + 1;
      const res = await fetchMessagesByPage(conversationId, nextPage);

      if (res.success) {
        const page = res.data;
        setMessages((prev) => [...prev, ...page.data]);
        const current = page.meta?.current_page ?? nextPage;
        const last = page.meta?.last_page ?? current;
        setPagination({ current, last });
        setHasMore(current < last);
      } else {
        console.error("fetchMessagesByPage failed:", res.error);
      }
    } finally {
      setIsFetchingMore(false);
    }
  }, [conversationId, hasMore, isFetchingMore, isLoading, pagination.current]);

  const handleCancelEditing = useCallback(() => {
    setEditingMessage(null);
    setText("");
  }, []);

  const startEditingMessage = useCallback((message: ApiMessage) => {
    setEditingMessage(message);
    setText(message.content ?? "");
  }, []);

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      const normalizedId = String(messageId);
      const res = await deleteMessageSvc(conversationId, {
        messageId: normalizedId,
      });

      if (res.success) {
        setMessages((prev) =>
          prev.filter((m) => String(m.id) !== normalizedId),
        );
        if (editingMessage && String(editingMessage.id) === normalizedId) {
          setEditingMessage(null);
          setText("");
        }
      } else {
        console.error("deleteMessage failed:", res.error);
      }
    },
    [conversationId, editingMessage],
  );

  const confirmDeleteMessage = useCallback(
    (messageId: string) => {
      Alert.alert("Delete message?", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDeleteMessage(messageId);
          },
        },
      ]);
    },
    [handleDeleteMessage],
  );

  const handleMessageLongPress = useCallback(
    (message: ApiMessage) => {
      if (String(message.senderId) !== String(user?.id)) return;

      Alert.alert("Message options", undefined, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit",
          onPress: () => {
            startEditingMessage(message);
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            confirmDeleteMessage(String(message.id));
          },
        },
      ]);
    },
    [confirmDeleteMessage, startEditingMessage, user?.id],
  );

  const handleSubmit = async () => {
    if (!user) return;
    const content = text.trim();
    if (!content) return;

    setIsSending(true);
    try {
      if (editingMessage) {
        const res = await updateMessageSvc(conversationId, {
          messageId: String(editingMessage.id),
          content,
        });

        if (res.success) {
          const updated = res.data;
          setMessages((prev) =>
            prev.map((msg) =>
              String(msg.id) === String(updated.id)
                ? { ...msg, ...updated }
                : msg,
            ),
          );
          setEditingMessage(null);
          setText("");
        } else {
          console.error("updateMessage failed:", res.error);
        }
      } else {
        const res = await sendMessageSvc(
          conversationId,
          { content },
          { currentUserId: user.id },
        );

        if (res.success) {
          setMessages((prev) => [res.data.message, ...prev]);
          setText("");
        } else {
          console.error("sendMessage failed:", res.error);
        }
      }
    } finally {
      setIsSending(false);
    }
  };

  const listData = useMemo<MessageListItem[]>(() => {
    const nextItems: MessageListItem[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const createdAt = new Date(msg.createdAt);

      nextItems.push({
        type: "message",
        id: String(msg.id),
        message: msg,
      });

      if (Number.isNaN(createdAt.getTime())) {
        continue;
      }

      const dateKey = getDateKey(createdAt);

      const nextMsg = messages[i + 1];
      const nextDateKey = nextMsg
        ? getDateKey(new Date(nextMsg.createdAt))
        : null;

      if (dateKey !== nextDateKey) {
        nextItems.push({
          type: "date",
          id: `date-${dateKey}`,
          label: formatDateLabel(createdAt),
        });
      }
    }

    return nextItems;
  }, [formatDateLabel, messages]);

  const formatTimestamp = useCallback(
    (date: Date) => {
      if (Number.isNaN(date.getTime())) return "";
      return timeFormatter.format(date);
    },
    [timeFormatter],
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList<MessageListItem>
          data={listData}
          inverted
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (item.type === "date") {
              return (
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateSeparatorText}>{item.label}</Text>
                </View>
              );
            }

            const message = item.message;
            const isMe = String(message.senderId) === String(user?.id);
            const body =
              message.content?.trim() ||
              (message.attachment?.urls?.original ? "📎 Attachment" : "");
            const isEditingThis =
              editingMessage &&
              String(editingMessage.id) === String(message.id);
            const createdAt = new Date(message.createdAt);
            const timestamp = formatTimestamp(createdAt);

            return (
              <TouchableOpacity
                activeOpacity={isMe ? 0.8 : 1}
                onLongPress={() => handleMessageLongPress(message)}
                delayLongPress={200}
                disabled={!isMe}
              >
                <View
                  style={[
                    styles.msgBubble,
                    isMe ? styles.msgMe : styles.msgThem,
                    isEditingThis && styles.msgEditing,
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      isMe ? styles.textMe : styles.textThem,
                    ]}
                  >
                    {body}
                  </Text>
                  {timestamp ? (
                    <Text
                      style={[
                        styles.msgTimestamp,
                        isMe ? styles.timestampMe : styles.timestampThem,
                      ]}
                    >
                      {timestamp}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
          onEndReached={loadOlderMessages}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            isFetchingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          }
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputWrapper}>
          {editingMessage && (
            <View style={styles.editingBanner}>
              <Text style={styles.editingBannerText}>Editing message</Text>
              <TouchableOpacity
                onPress={handleCancelEditing}
                activeOpacity={0.8}
              >
                <Text style={styles.editingCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={
                editingMessage ? "Edit your message..." : "Type a message..."
              }
              value={text}
              onChangeText={setText}
              placeholderTextColor="#94a3b8"
              multiline
            />
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.sendBtn,
                (text.trim().length === 0 || isSending) &&
                  styles.sendBtnDisabled,
              ]}
              disabled={text.trim().length === 0 || isSending}
              activeOpacity={0.8}
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },

  listContent: { padding: 16, paddingBottom: 20 },

  dateSeparator: {
    alignSelf: "center",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 10,
  },
  dateSeparatorText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },

  msgBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  msgMe: {
    alignSelf: "flex-end",
    backgroundColor: "#667eea",
    borderBottomRightRadius: 4,
  },
  msgThem: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  msgEditing: {
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },

  msgText: { fontSize: 15, lineHeight: 20 },
  textMe: { color: "#fff" },
  textThem: { color: "#1e293b" },
  msgTimestamp: { fontSize: 11, marginTop: 6, alignSelf: "flex-end" },
  timestampMe: { color: "#e0e7ff", opacity: 0.9 },
  timestampThem: { color: "#475569" },

  inputWrapper: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    color: "#1e293b",
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: "#667eea",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },

  emptyState: { padding: 40, alignItems: "center" },
  emptyText: { color: "#94a3b8", fontSize: 16 },
  loadingMore: {
    paddingVertical: 16,
  },
  editingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f5f3ff",
  },
  editingBannerText: { color: "#4c1d95", fontSize: 13, fontWeight: "600" },
  editingCancel: { color: "#7c3aed", fontSize: 13, fontWeight: "600" },
});
