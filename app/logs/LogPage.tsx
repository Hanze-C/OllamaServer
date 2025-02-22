import React, {useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ScrollView} from 'react-native'; // 添加 ScrollView 导入
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import {useNavigation} from "@react-navigation/native";
import {Appbar} from "react-native-paper";
import {useAppTheme} from "../theme/ThemeContext.tsx";

const readLogsFromFile = async () => {
    try {
        const fileUri = RNFS.DocumentDirectoryPath + '/logs/ollama_log.txt';
        return await RNFS.readFile(fileUri, 'utf8');
    } catch (error) {
        console.error('Error reading logs file:', error);
        return "";
    }
};

const LogPage = () => {
    const theme = useAppTheme();
    const navigation = useNavigation();
    const [logs, setLogs] = useState("");

    useEffect(() => {
        const getLogs = async () => {
            const fetchedLogs = await readLogsFromFile();
            setLogs(fetchedLogs);
        };
        getLogs();

        const intervalId = setInterval(getLogs, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

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
                    <Appbar.Content title="Server Log"/>
                </Appbar.Header>

                {/* Scrollable Log Area */}
                <ScrollView style={styles.logsContainer}>
                    <Text style={styles.logText}>{logs}</Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default LogPage;
