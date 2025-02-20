import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet, ToastAndroid, ListRenderItem,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import ModelSelector from "../components/ModelSelector.tsx";
import {CustomProgressBarWithoutProgressModal} from "../components/CustomModal.tsx";
import {chat, loadModel} from "../utils/OllamaApi.ts";
import Markdown from "react-native-markdown-display";

const HomePage = () => {
    //加载模型
    const [loadingModalVisible, setLoadingModalVisible] = useState(false)
    //输入消息
    const [message, setMessage] = useState('');
    // 使用state触发渲染
    const [messagesState, setMessagesState] = useState<Message[]>([]);
    // 使用ref保持最新值
    const messagesRef = useRef<Message[]>([]);
    //模型选择
    const [selectedModel, setSelectedModel] = useState<string>('Select Model');
    //消息列表
    const flatListRef = useRef<FlatList<Message>>(null);
    //正在接收消息
    const [chatting, setChatting] = useState(false)
    //接收到的消息请求
    const chatSessionRef = useRef<ChatSessionType | null>(null);

    const navigation = useNavigation();

    const handleSettingsPress = () => {
        // @ts-ignore
        navigation.navigate('Settings');
    };

    const handleSend = () => {
        if (chatting) {
            chatSessionRef.current?.abort()
            setChatting(false)
            let lastMsg = messagesRef.current[messagesRef.current.length - 1];
            lastMsg.content += '(User Cancel)'
            messagesRef.current[messagesRef.current.length - 1] = lastMsg;
            setMessagesState([...messagesRef.current]);
            return
        }
        if (message.trim()) {
            setChatting(true)
            let addedAssistantMessage = false
            const userMsg: Message = {
                role: 'user',
                content: message
            }
            // 同时更新ref和state
            messagesRef.current = [...messagesRef.current, userMsg]
            setMessagesState(messagesRef.current)
            setMessage('')
            flatListRef.current?.scrollToEnd({ animated: true })

            chatSessionRef.current = chat(selectedModel, messagesRef.current, chatResponse => {
                if (!chatResponse.done) {
                    // @ts-ignore
                    if (!addedAssistantMessage) {
                        addedAssistantMessage = true;
                        // @ts-ignore
                        messagesRef.current = [...messagesRef.current, chatResponse.message]
                        setMessagesState([...messagesRef.current]);
                    } else {
                        let lastMsg = messagesRef.current[messagesRef.current.length - 1];
                        lastMsg.content += chatResponse.message?.content;
                        messagesRef.current[messagesRef.current.length - 1] = lastMsg;
                        setMessagesState([...messagesRef.current]);
                    }
                }
            })
            chatSessionRef.current.promise.catch(e => {
                ToastAndroid.show(`Chat error ${e}`, ToastAndroid.SHORT)
            }).finally(() => {
                setChatting(false)
                chatSessionRef.current = null
            })
        }
    }

    const handleModelSelect = (model: OllamaModel) => {
        setSelectedModel(model.name);
        setLoadingModalVisible(true);
        loadModel(model.name)
            .then((response: LoadResponse) => {
                if (response.done_reason != 'load') {
                    setSelectedModel('AI Assistant')
                    ToastAndroid.show('Loading Model error', ToastAndroid.SHORT)
                }
                setLoadingModalVisible(false);
            })
            .catch((e) => {
                setSelectedModel('Select Model')
                setLoadingModalVisible(false);
                ToastAndroid.show(`Loading Model error ${e}`, ToastAndroid.SHORT)
            })
    };

    const renderMessage: ListRenderItem<Message> = ({ item }) => (
        <View style={[
            styles.messageRow,
            item.role === 'assistant' ? styles.botMessageRow : styles.userMessageRow
        ]}>
            {item.role === 'assistant' && (
                <View style={styles.avatarContainer}>
                    <View style={[
                        styles.avatar,
                        item.role === 'assistant' ? styles.botAvatar : styles.userAvatar
                    ]}>
                        <Text style={styles.avatarText}>
                            {item.role === 'assistant' ? 'AI' : 'U'}
                        </Text>
                    </View>
                </View>
            )}
            <View
                style={[
                    styles.messageContainer,
                    item.role === 'assistant' ? styles.botMessage : styles.userMessage,
                ]}>
                <Markdown
                    style={item.role === 'assistant' ? assistantMarkdownStyles : userMarkdownStyles}
                >
                    {item.content.replace(
                        /<think>([\s\S]*?)<\/think>/g,
                        '> $1')}
                </Markdown>
            </View>
            {item.role !== 'assistant' && (
                <View style={styles.avatarContainer}>
                    <View style={[
                        styles.avatar,
                        item.role === 'assistant' ? styles.botAvatar : styles.userAvatar
                    ]}>
                        <Text style={styles.avatarText}>
                            {item.role === 'assistant' ? 'AI' : 'U'}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Fixed Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => {}}>
                        <Icon name="menu" size={24} color="#000000" />
                    </TouchableOpacity>
                    <ModelSelector
                        currentModel={selectedModel}
                        onModelSelect={handleModelSelect}
                    />
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={handleSettingsPress}>
                        <Icon name="settings" size={24} color="#000000" />
                    </TouchableOpacity>
                </View>

                {/* Scrollable Message Area */}
                <View style={styles.messagesContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={messagesState}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.messagesList}
                        showsVerticalScrollIndicator={true}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />
                </View>

                {/* Fixed Input Bar */}
                <KeyboardAvoidingView
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Type your message..."
                            multiline
                            maxHeight={100}
                            editable={!chatting}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, chatting && styles.cancelButton]}
                            onPress={handleSend}>
                            <Text style={styles.sendButtonText}>
                                {chatting ? 'Cancel' : 'Send'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                <CustomProgressBarWithoutProgressModal
                    visible={loadingModalVisible}
                    onRequestClose={() => {}}
                    title="Loading Model"
                    info={`Loading ${selectedModel}...`}
                />
            </SafeAreaView>
        </View>
    );
};

const assistantMarkdownStyles = {
    heading1: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    heading2: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 16,
        color: '#000',
        marginBottom: 8,
    },
    code_block: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 4,
        fontSize: 14,
        color: '#000',
        fontFamily: 'Courier',
    },
    blockquote: {
        backgroundColor: 'rgba(0,0,0,0)',  // 背景色
        borderLeftColor: 'rgba(0,0,0,0)',  // 左边框颜色
        borderLeftWidth: 0,          // 左边框宽度
        paddingHorizontal: 0,       // 水平内边距
        paddingVertical: 0,          // 垂直内边距
        marginVertical: 0,           // 垂直外边距
        borderRadius: 0,             // 圆角
        fontStyle: 'italic',         // 字体样式
    },
};

const userMarkdownStyles = {
    heading1: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    heading2: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 8,
    },
    code_block: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 4,
        fontSize: 14,
        color: '#fff',
        fontFamily: 'Courier',
    },
    blockquote: {
        backgroundColor: 'rgba(0,0,0,0)',  // 背景色
        borderLeftColor: 'rgba(0,0,0,0)',  // 左边框颜色
        borderLeftWidth: 0,          // 左边框宽度
        paddingHorizontal: 0,       // 水平内边距
        paddingVertical: 0,          // 垂直内边距
        marginVertical: 0,           // 垂直外边距
        borderRadius: 0,             // 圆角
        fontStyle: 'italic',         // 字体样式
    },
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        height: 60,
        backgroundColor: '#ffffff',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        zIndex: 10,
        flexDirection: 'row',
    },
    settingsButton: {
        position: 'absolute',
        right: 16,
    },
    menuButton: {
        marginRight: 16,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    pickerContainer: {
        height: 50,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    picker: {
        height: 50,  // 明确设置高度
        width: '100%',
        backgroundColor: '#fff',
    },
    messagesContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    messagesList: {
        paddingHorizontal: 4,
        paddingVertical: 16,
        flexGrow: 1,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    botMessageRow: {
        justifyContent: 'flex-start',
    },
    userMessageRow: {
        justifyContent: 'flex-end',
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    avatarContainer: {
        marginHorizontal: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    botAvatar: {
        backgroundColor: '#e0e0e0',
    },
    userAvatar: {
        backgroundColor: '#007AFF',
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    botMessage: {
        backgroundColor: '#ffffff',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    userMessage: {
        backgroundColor: '#007AFF',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#d81901',
    },
    sendButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    think: {
        color: '#1E90FF',
        fontStyle: 'italic',
        fontSize: 14,
    },
});

export default HomePage;
