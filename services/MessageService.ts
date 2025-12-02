import api from "@/lib/api";
import type {
  Conversation,
  Message,
  PaginatedMessages,
  ServiceResult,
} from "@/types";
import { useChatStore } from "@/stores/chat.store";

export type RNFile = {
  uri: string;
  name?: string;
  type?: string;
};

type MutateMessages = (
  updater:
    | PaginatedMessages[]
    | undefined
    | ((
        current: PaginatedMessages[] | undefined,
      ) => PaginatedMessages[] | undefined),
  options?: { revalidate?: boolean } | boolean,
) => Promise<any> | any;

export async function fetchMessagesFirstPage(
  conversationId: string,
): Promise<ServiceResult<PaginatedMessages>> {
  try {
    const res = await api.get(`/conversations/${conversationId}/messages`);
    return { success: true, data: res.data as PaginatedMessages };
  } catch (error) {
    return { success: false, error };
  }
}

export async function fetchMessagesByPage(
  conversationId: string,
  page: number,
): Promise<ServiceResult<PaginatedMessages>> {
  try {
    const res = await api.get(
      `/conversations/${conversationId}/messages?page=${page}`,
    );
    return { success: true, data: res.data as PaginatedMessages };
  } catch (error) {
    return { success: false, error };
  }
}

export async function sendMessage(
  conversationId: string,
  arg: { content?: string; attachment?: RNFile },
  opts?: {
    currentUserId?: string;
    mutateMessages?: MutateMessages;
  },
): Promise<ServiceResult<{ message: Message; conversation: Conversation }>> {
  try {
    const form = new FormData();

    if (arg.content) form.append("content", arg.content);

    if (arg.attachment) {
      const file = arg.attachment;
      form.append("attachment", {
        uri: file.uri,
        name: file.name ?? "attachment",
        type: file.type ?? "application/octet-stream",
      } as any);
    }

    const res = await api.post(
      `/conversations/${conversationId}/messages`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    const data = res.data.data as {
      message: Message;
      conversation: Conversation;
    };
    const { message, conversation } = data;

    // ensure convo exists
    const exists = useChatStore.getState().conversations[conversation.id];
    if (!exists) useChatStore.getState().addConversation(conversation);

    // update sidebar ordering / last message / unread
    useChatStore
      .getState()
      .updateConversationOnNewMessage(message, opts?.currentUserId);

    // update message list cache if caller provides mutateMessages (SWR infinite in RN)
    if (opts?.mutateMessages) {
      opts.mutateMessages(
        (currentPages: PaginatedMessages[] | undefined) => {
          if (!currentPages || currentPages.length === 0) {
            const newPage: PaginatedMessages = {
              data: [message],
              links: { first: null, last: null, prev: null, next: null },
              meta: { current_page: 1, last_page: 1, per_page: 30, total: 1 },
            };
            return [newPage];
          }

          const newPages: PaginatedMessages[] = JSON.parse(
            JSON.stringify(currentPages),
          );
          newPages[0].data.unshift(message);
          return newPages;
        },
        { revalidate: false },
      );
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function updateMessage(
  conversationId: string,
  arg: { messageId: string; content: string },
  opts?: { mutateMessages?: MutateMessages },
): Promise<ServiceResult<Message>> {
  try {
    const res = await api.patch(
      `/conversations/${conversationId}/messages/${arg.messageId}`,
      { content: arg.content },
    );

    const updatedMessage = res.data.data as Message;

    useChatStore.getState().updateConversationOnMessageUpdate(updatedMessage);

    if (opts?.mutateMessages) {
      opts.mutateMessages(
        (currentPages: PaginatedMessages[] | undefined) => {
          if (!currentPages) return currentPages;

          return currentPages.map((page) => ({
            ...page,
            data: page.data.map((m) =>
              String(m.id) === String(updatedMessage.id)
                ? { ...m, ...updatedMessage }
                : m,
            ),
          }));
        },
        { revalidate: false },
      );
    }

    return { success: true, data: updatedMessage };
  } catch (error) {
    return { success: false, error };
  }
}

export async function deleteMessage(
  conversationId: string,
  arg: { messageId: string },
  opts?: { mutateMessages?: MutateMessages },
): Promise<
  ServiceResult<{
    deletedId: string;
    wasLastMessage: boolean;
    newLastMessage: Message | null;
  }>
> {
  try {
    const res = await api.delete(
      `/conversations/${conversationId}/messages/${arg.messageId}`,
    );

    // your backend returns this shape (based on your hook)
    const data = res.data as {
      deletedId: string;
      wasLastMessage: boolean;
      newLastMessage: Message | null;
    };

    useChatStore
      .getState()
      .updateConversationOnMessageDelete(
        conversationId,
        data.wasLastMessage,
        data.newLastMessage,
        false,
      );

    if (opts?.mutateMessages) {
      opts.mutateMessages(
        (currentPages: PaginatedMessages[] | undefined) => {
          if (!currentPages) return currentPages;
          return currentPages.map((page) => ({
            ...page,
            data: page.data.filter(
              (m) => String(m.id) !== String(data.deletedId),
            ),
          }));
        },
        { revalidate: false },
      );
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}
