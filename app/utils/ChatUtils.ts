export const getSummary = (messages: Message[]) => {
    if (messages.length === 0) return 'Unknown Conversation'
    return messages[0].content.substring(0, 10);
}
