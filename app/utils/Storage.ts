import AsyncStorage from '@react-native-async-storage/async-storage';
import {Conversation, ConversationSummary} from "../model/Conversation.ts";

const CONVERSATIONS_MESSAGES_KEY_PREFIX = '@conversation_messages_';
const CONVERSATIONS_SUMMARY_KEY_PREFIX = '@conversation_summary_';
const CONVERSATIONS_SUMMARIES_KEY = '@conversation_summaries';

const saveConversation = async (conversationId: string, messages: Message[], summary: string) => {
    try {
        const messagesKey = `${CONVERSATIONS_MESSAGES_KEY_PREFIX}${conversationId}`;

        // 存储对话内容
        await AsyncStorage.setItem(messagesKey, JSON.stringify({ id: conversationId, messages }));

        // 更新对话摘要列表
        const existingSummaries = await AsyncStorage.getItem(CONVERSATIONS_SUMMARIES_KEY);
        let summaries: ConversationSummary[] = existingSummaries ? JSON.parse(existingSummaries) : [];

        // 检查是否已经存在该对话摘要，如果存在则更新，否则添加
        const existingSummaryIndex = summaries.findIndex(summary => summary.id === conversationId);
        if (existingSummaryIndex !== -1) {
            summaries[existingSummaryIndex] = { id: conversationId, summary };
        } else {
            summaries.push({ id: conversationId, summary });
        }

        await AsyncStorage.setItem(CONVERSATIONS_SUMMARIES_KEY, JSON.stringify(summaries));
    } catch (e) {
        console.error('Failed to save conversation:', e);
    }
};

const loadConversation = async (id: string) => {
    try {
        const messagesKey = `${CONVERSATIONS_MESSAGES_KEY_PREFIX}${id}`;
        const summaryKey = `${CONVERSATIONS_SUMMARY_KEY_PREFIX}${id}`;

        const messagesJson = await AsyncStorage.getItem(messagesKey);

        if (messagesJson != null) {
            return JSON.parse(messagesJson) as Conversation
        }
    } catch (e) {
        console.error('Failed to load conversation:', e);
    }
};

const getAllSummaries = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(CONVERSATIONS_SUMMARIES_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue) as ConversationSummary[];
        }
        return [];
    } catch (e) {
        console.error('Failed to get all summaries:', e);
        return [];
    }
};

export {saveConversation, loadConversation, getAllSummaries};

