type Conversation = {
    id: string;
    messages: Message[];
};

type ConversationSummary = {
    id: string;
    summary: string;
    lastConversation: string;
};

export type { Conversation, ConversationSummary }
