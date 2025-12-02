export type User = {
  id: string;
  name: string;
  tag: string;
  email: string;
  avatar: {
    original: string;
    medium: string;
    small: string;
  } | null;
  isEmailVerified: boolean | null;
};

export type Conversation = {
  id: string;
  userTag: string | null;
  title: string;
  description?: string;
  lastMessage: Message | null;
  hasUnread: boolean;
  avatar: {
    original: string;
    medium: string;
    small: string;
  } | null;
  type: string;
  participants: User[];
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MessageAttachment = {
  id: string;
  data: {
    original: string;
    type: string;
    size: number;
    mime_type: string;
    original_name: string;
    thumbnail?: string;
  };
  urls: {
    original: string;
    thumbnail?: string;
  };
};

export type Message = {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  editedAt: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    tag: string;
    avatar: string;
  };
  attachment: MessageAttachment;
};

export interface Paginated<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export type PaginatedMessages = Paginated<Message>;

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: unknown };
