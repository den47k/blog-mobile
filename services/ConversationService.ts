import api from "@/lib/api";
import type { Conversation, ServiceResult } from "@/types";
import { useChatStore } from "@/stores/chat.store";

export async function fetchConversation(
  conversationId: string,
): Promise<ServiceResult<Conversation>> {
  try {
    const res = await api.get(`/conversations/private/${conversationId}`);
    return { success: true, data: res.data.data as Conversation };
  } catch (error) {
    return { success: false, error };
  }
}

export async function fetchConversations(): Promise<
  ServiceResult<Conversation[]>
> {
  try {
    const res = await api.get("/conversations");
    const conversations = res.data.data as Conversation[];

    useChatStore.getState().setConversations(conversations);

    return { success: true, data: conversations };
  } catch (error) {
    return { success: false, error };
  }
}

export async function createPrivateConversation(
  userId: string,
  shouldJoinNow: boolean = false,
): Promise<ServiceResult<Conversation | true>> {
  try {
    const res = await api.post("/conversations/private", {
      user_id: userId,
      should_join_now: shouldJoinNow,
    });

    const payload = res.data?.data ?? res.data;
    const conversation =
      payload?.conversation ?? (payload?.id ? payload : null) ?? null;

    if (conversation?.id) {
      // useChatStore.getState().addConversation(conversation as Conversation);
      return { success: true, data: conversation as Conversation };
    }

    return { success: true, data: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function deleteConversation(
  conversationId: string,
): Promise<ServiceResult<true>> {
  try {
    await api.delete(`/conversations/${conversationId}`);
    useChatStore.getState().removeConversation(conversationId);
    return { success: true, data: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function markConversationAsRead(
  conversationId: string,
): Promise<ServiceResult<true>> {
  try {
    await api.post(`/conversations/${conversationId}/mark-as-read`);
    useChatStore.getState().markConversationAsRead(conversationId);
    return { success: true, data: true };
  } catch (error) {
    return { success: false, error };
  }
}
