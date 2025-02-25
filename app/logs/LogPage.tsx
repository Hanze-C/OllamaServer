import React, {useEffect, useRef, useState} from 'react';
import {SafeAreaView, StyleSheet, Text, View, ScrollView} from 'react-native'; // 添加 ScrollView 导入
import RNFS from 'react-native-fs';
import {useNavigation} from "@react-navigation/native";
import {Appbar} from "react-native-paper";
import {useAppTheme} from "../theme/ThemeContext.tsx";
import LoadingDialog from "../components/LoadingDialog.tsx";
import {useTranslation} from "react-i18next";

const readLogsFromFile = async (startPosition: number) => {
    const filePath = `${RNFS.DocumentDirectoryPath}/logs/ollama.log`;

    // 获取文件最新信息
    const fileInfo = await RNFS.stat(filePath);

    // 文件大小小于记录位置时，说明文件被重置
    if (fileInfo.size < startPosition) {
        throw new Error('File reset');
    }

    // 只读取新增内容
    const chunkSize = 1024 * 1024; // 每次读取1MB
    const endPosition = Math.min(startPosition + chunkSize, fileInfo.size);

    const content = await RNFS.read(filePath, endPosition - startPosition, startPosition, 'utf8');

    return {
        newLogs: content,
        newPosition: endPosition
    };
};

const LogPage = () => {
    const theme = useAppTheme();
    const { t, i18n } = useTranslation();
    const navigation = useNavigation();
    const scrollViewRef = useRef<ScrollView>(null);
    const [logs, setLogs] = useState<string>("");
    // 记录上次日志读取位置
    const lastReadPosition = useRef(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const getLogs = () => {
            // 只有首次加载时需要显示对话框
            if (lastReadPosition.current == 0) {
                setIsLoading(true)
            }
            readLogsFromFile(lastReadPosition.current)
                .then(({ newLogs, newPosition})=>{
                    if (newLogs.length > 0) {
                        setLogs(prevLogs => prevLogs + newLogs);
                    }
                    lastReadPosition.current = newPosition;
                })
                .catch((err)=>{
                    if (err.message.includes('File reset')) {
                        lastReadPosition.current = 0;
                        getLogs();
                    }
                })
                .finally(()=>{
                    setIsLoading(false)
                })
        };
        getLogs();

        const intervalId = setInterval(getLogs, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    const saveLog = async () => {

    }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.surface,
        },
        safeArea: {
            flex: 1,
        },
        header: {
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.surfaceContainerLow,
        },
        logsContainer: {
            flex: 1,
            backgroundColor: theme.colors.surface,
        },
        logsList: {
            padding: 16,
            flexGrow: 1,
        },
        logRow: {
            flexDirection: 'column',
            marginVertical: 4,
        },
        logText: {
            fontSize: 16,
            lineHeight: 20,
            color: theme.colors.onSurface,
        },
    });

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <Appbar.Header mode={'center-aligned'} style={styles.header}>
                    <Appbar.BackAction onPress={() => {navigation.goBack()}} />
                    <Appbar.Content title={t('serverLog')}/>
                    <Appbar.Action icon="arrow-down" onPress={() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true })
                    }} />
                    <Appbar.Action icon="content-save" onPress={() => {
                        saveLog()
                    }} />
                </Appbar.Header>

                <ScrollView
                    ref={scrollViewRef}
                    style={styles.logsContainer}
                >
                    <Text style={styles.logText}>{logs}</Text>
                </ScrollView>

                <LoadingDialog
                    visible={isLoading}
                    title={t('waiting')}
                    message={t('loadingLog')}
                />
            </SafeAreaView>
        </View>
    );
};

export default LogPage;
