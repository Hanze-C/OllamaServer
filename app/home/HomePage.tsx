import React, {useState, useRef, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet, ToastAndroid, ListRenderItem, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NavigationProp, ParamListBase, useNavigation} from '@react-navigation/native';
import ModelSelector from "../components/ModelSelector.tsx";
import {chat, loadModel} from "../api/OllamaApi.ts";
import Markdown from "react-native-markdown-display";
import {DrawerNavigationProp} from "@react-navigation/drawer";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {loadConversation, saveConversation} from "../utils/Storage.ts";
import {getSummary} from "../utils/ChatUtils.ts";
import {useAppTheme} from "../theme/ThemeContext.tsx";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Dialog, Portal} from "react-native-paper";

type HomeScreenNavigationProp = NavigationProp<ParamListBase> & DrawerNavigationProp<ParamListBase>;

const HomePage = ({ route }) => {
    const theme = useAppTheme();
    const insets = useSafeAreaInsets();
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
    //对话唯一标识
    const conversationUuidRef = useRef(uuidv4());

    const navigation = useNavigation<HomeScreenNavigationProp>();

    // effect处理对话加载
    useEffect(() => {
        const loadExistingConversation = async () => {
            if (route.params?.conversationId) {
                const existing = await loadConversation(route.params.conversationId);
                if (existing) {
                    messagesRef.current = existing.messages;
                    setMessagesState(existing.messages);
                    conversationUuidRef.current = route.params.conversationId; // 更新当前对话ID
                }
            }
        };
        loadExistingConversation();
    }, [route.params?.conversationId, route.params?.timestamp]); // 添加timestamp依赖

    const handleNewPress = () => {
        //已经是新对话
        if (messagesRef.current.length === 0) {
            return
        }
        saveConversation(conversationUuidRef.current, messagesRef.current, getSummary(messagesRef.current))
            .then(r => {
                //更新对话唯一表示
                conversationUuidRef.current = uuidv4();
                //清除历史消息
                messagesRef.current = []
                setMessagesState([]);
            })
    };

    const handleSend = () => {
        if (chatting) {
            chatSessionRef.current?.abort()
            setChatting(false)
            let lastMsg = messagesRef.current[messagesRef.current.length - 1];
            lastMsg.content += '(User Cancel)'
            messagesRef.current[messagesRef.current.length - 1] = lastMsg;
            setMessagesState([...messagesRef.current]);
            // 保存对话
            saveConversation(conversationUuidRef.current, messagesRef.current, getSummary(messagesRef.current))
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
            // 保存对话
            saveConversation(conversationUuidRef.current, messagesRef.current, getSummary(messagesRef.current))
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
                // 回答完毕后保存对话
                saveConversation(conversationUuidRef.current, messagesRef.current, getSummary(messagesRef.current))
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

    const assistantMarkdownStyles = {
        heading1: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.onSurface,
            marginBottom: 8,
        },
        heading2: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.onSurface,
            marginBottom: 8,
        },
        paragraph: {
            fontSize: 16,
            color: theme.colors.onSurface,
            marginBottom: 8,
        },
        code_block: {
            backgroundColor: '#f0f0f0',
            padding: 8,
            borderRadius: 4,
            fontSize: 14,
            color: theme.colors.onSurface,
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
            color: theme.colors.surface,
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
            color: theme.colors.surface,
            marginBottom: 8,
        },
        code_block: {
            backgroundColor: '#f0f0f0',
            padding: 8,
            borderRadius: 4,
            fontSize: 14,
            color: theme.colors.surface,
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
            backgroundColor: theme.colors.background,
            paddingTop: insets.top,
        },
        safeArea: {
            flex: 1,
        },
        header: {
            height: 60,
            backgroundColor: theme.colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.surfaceContainerLow,
            zIndex: 10,
            flexDirection: 'row',
        },
        newButton: {
            position: 'absolute',
            right: 16,
        },
        menuButton: {
            position: 'absolute',
            left: 16,
        },
        messagesContainer: {
            flex: 1,
            backgroundColor: theme.colors.surface,
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
            backgroundColor: theme.colors.secondary,
        },
        userAvatar: {
            backgroundColor: theme.colors.secondary,
        },
        avatarText: {
            color: theme.colors.onSecondary,
            fontSize: 14,
            fontWeight: 'bold',
        },
        botMessage: {
            backgroundColor: theme.colors.inverseOnSurface,
            alignSelf: 'flex-start',
            borderBottomLeftRadius: 4,
        },
        userMessage: {
            backgroundColor: theme.colors.primary,
            alignSelf: 'flex-end',
            borderBottomRightRadius: 4,
        },
        inputContainer: {
            flexDirection: 'row',
            padding: 16,
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.surfaceContainerLow,
        },
        input: {
            flex: 1,
            backgroundColor: theme.colors.secondaryContainer,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginRight: 8,
            fontSize: 16,
            maxHeight: 100,
        },
        sendButton: {
            backgroundColor: theme.colors.primary,
            color: theme.colors.onPrimary,
            borderRadius: 20,
            paddingHorizontal: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        cancelButton: {
            backgroundColor: theme.colors.error,
        },
        sendButtonText: {
            color: theme.colors.onPrimary,
            fontSize: 16,
        },
        text: {
            color: theme.colors.onSurface
        }
    });

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Fixed Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => {navigation.openDrawer()}}>
                        <Icon name="menu" size={24} color={theme.colors.onSurface} />
                    </TouchableOpacity>
                    <ModelSelector
                        currentModel={selectedModel}
                        onModelSelect={handleModelSelect}
                    />
                    <TouchableOpacity
                        style={styles.newButton}
                        onPress={handleNewPress}>
                        <Icon name="add-comment" size={24} color={theme.colors.onSurface} />
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

                <Portal>
                    <Dialog visible={loadingModalVisible}>
                        <Dialog.Title>Waiting</Dialog.Title>
                        <Dialog.Content>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <Text style={[styles.text, { flex: 1 }]}>
                                    Loading Model {selectedModel}...
                                </Text>
                                <ActivityIndicator
                                    animating={true}
                                    color={theme.colors.primary}
                                    size={'large'}
                                />
                            </View>
                        </Dialog.Content>
                    </Dialog>
                </Portal>
            </SafeAreaView>
        </View>
    );
};

export default HomePage;
