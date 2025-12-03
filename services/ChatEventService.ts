import echo from "@/lib/echo";
import { useChatStore } from "@/stores/chat.store";
import type { Conversation, Message } from "@/types";

type MessageCreatedPayload = { message: Message };
type MessageUpdatedPayload = { message: Message };
type MessageDeletedPayload = {
  conversationId: string;
  deletedId: string;
  wasLastMessage: boolean;
  newLastMessage: Message | null;
  hasUnread: boolean;
};
type ConversationCreatedPayload = { conversation: Conversation };
type ConversationDeletedPayload = { id: string };

type PrivateChannel = ReturnType<(typeof echo)["private"]>;

class ChatEventService {
  private channel: PrivateChannel | null = null;
  private currentUserId: string | null = null;

  start(userId: string) {
    if (!userId) return;

    if (this.channel && this.currentUserId === userId) {
      return;
    }

    this.stop();

    this.currentUserId = userId;
    this.channel = echo.private(`user.${userId}`);

    this.channel.listen(".MessageCreatedEvent", this.handleMessageCreated);
    this.channel.listen(".MessageUpdatedEvent", this.handleMessageUpdated);
    this.channel.listen(".MessageDeletedEvent", this.handleMessageDeleted);
    this.channel.listen(".ConversationCreated", this.handleConversationCreated);
    this.channel.listen(".ConversationDeleted", this.handleConversationDeleted);
  }

  stop() {
    if (this.channel) {
      this.channel.stopListening(
        ".MessageCreatedEvent",
        this.handleMessageCreated,
      );
      this.channel.stopListening(
        ".MessageUpdatedEvent",
        this.handleMessageUpdated,
      );
      this.channel.stopListening(
        ".MessageDeletedEvent",
        this.handleMessageDeleted,
      );
      this.channel.stopListening(
        ".ConversationCreated",
        this.handleConversationCreated,
      );
      this.channel.stopListening(
        ".ConversationDeleted",
        this.handleConversationDeleted,
      );

      if (this.currentUserId) {
        echo.leave(`user.${this.currentUserId}`);
      }
    }

    this.channel = null;
    this.currentUserId = null;
  }

  private readonly handleMessageCreated = (event: MessageCreatedPayload) => {
    if (!this.currentUserId) return;
    const { updateConversationOnNewMessage } = useChatStore.getState();
    updateConversationOnNewMessage(event.message, this.currentUserId);
  };

  private readonly handleMessageUpdated = (event: MessageUpdatedPayload) => {
    const { updateConversationOnMessageUpdate } = useChatStore.getState();
    updateConversationOnMessageUpdate(event.message);
  };

  private readonly handleMessageDeleted = (event: MessageDeletedPayload) => {
    const { updateConversationOnMessageDelete } = useChatStore.getState();

    updateConversationOnMessageDelete(
      event.conversationId,
      event.wasLastMessage,
      event.newLastMessage,
      event.hasUnread,
    );
  };

  private readonly handleConversationCreated = (
    event: ConversationCreatedPayload,
  ) => {
    const { addConversation } = useChatStore.getState();
    addConversation(event.conversation);
  };

  private readonly handleConversationDeleted = (
    event: ConversationDeletedPayload,
  ) => {
    const { removeConversation } = useChatStore.getState();
    removeConversation(event.id);
  };
}

export default new ChatEventService();
