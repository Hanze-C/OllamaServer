type Conversation = {
    id: string;
    messages: Message[];
};

type ConversationSummary = {
    id: string;
    summary: string;
};

export type { Conversation, ConversationSummary }
