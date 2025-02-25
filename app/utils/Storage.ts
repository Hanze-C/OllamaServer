import AsyncStorage from '@react-native-async-storage/async-storage';
import {Conversation, ConversationSummary} from "../model/Conversation.ts";

const CONVERSATIONS_MESSAGES_KEY_PREFIX = '@conversation_messages_';
const CONVERSATIONS_SUMMARIES_KEY = '@conversation_summaries';

type EventHandler = () => void;
const eventMap = new Map<string, EventHandler[]>();

const StorageEvent = {
    SUMMARIES_UPDATED: 'summariesUpdated'
};

const subscribe = (event: string, handler: EventHandler) => {
    const handlers = eventMap.get(event) || [];
    handlers.push(handler);
    eventMap.set(event, handlers);
};

const unsubscribe = (event: string, handler: EventHandler) => {
    const handlers = eventMap.get(event) || [];
    eventMap.set(event, handlers.filter(h => h !== handler));
};

const emit = (event: string) => {
    const handlers = eventMap.get(event) || [];
    handlers.forEach(handler => handler());
};

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
        const newSummary= {
            id: conversationId,
            summary,
            lastConversation: new Date().toISOString()
        }
        if (existingSummaryIndex !== -1) {
            summaries[existingSummaryIndex] = newSummary;
        } else {
            summaries.push(newSummary);
        }

        await AsyncStorage.setItem(CONVERSATIONS_SUMMARIES_KEY, JSON.stringify(summaries));

        emit(StorageEvent.SUMMARIES_UPDATED);
    } catch (e) {
        console.error('Failed to save conversation:', e);
    }
};

const deleteConversation = async (conversationId: string) => {
    // 删除对话消息
    const messagesKey = `${CONVERSATIONS_MESSAGES_KEY_PREFIX}${conversationId}`;
    await AsyncStorage.removeItem(messagesKey);

    // 更新摘要列表
    const existingSummaries = await AsyncStorage.getItem(CONVERSATIONS_SUMMARIES_KEY);
    let summaries: ConversationSummary[] = existingSummaries ? JSON.parse(existingSummaries) : [];

    // 过滤掉要删除的对话摘要
    summaries = summaries.filter(summary => summary.id !== conversationId);
    await AsyncStorage.setItem(CONVERSATIONS_SUMMARIES_KEY, JSON.stringify(summaries));

    // 触发更新事件
    emit(StorageEvent.SUMMARIES_UPDATED);
};

const loadConversation = async (id: string) => {
    try {
        const messagesKey = `${CONVERSATIONS_MESSAGES_KEY_PREFIX}${id}`;

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

export {saveConversation, deleteConversation, loadConversation, getAllSummaries, subscribe, unsubscribe, StorageEvent};

