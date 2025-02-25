import React, {useEffect, useState} from 'react';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import 'react-native-gesture-handler';
import {createDrawerNavigator, DrawerContentScrollView, DrawerItem, useDrawerStatus} from "@react-navigation/drawer";
import HomePage from "../home/HomePage.tsx";
import {ConversationSummary} from "../model/Conversation.ts";
import {StorageEvent, getAllSummaries, subscribe, unsubscribe} from "../utils/Storage.ts";
import {useAppTheme} from "../theme/ThemeContext.tsx";
import {Divider} from "react-native-paper";

const Drawer = createDrawerNavigator();

const DrawerMenu = (props: any) => {
    const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
    const drawerStatus = useDrawerStatus(); // 获取抽屉状态
    const theme = useAppTheme();

    useEffect(() => {
        const handleSummariesUpdate = async () => {
            const data = await getAllSummaries();
            setSummaries(data);
        };
        handleSummariesUpdate();
        subscribe(StorageEvent.SUMMARIES_UPDATED, handleSummariesUpdate);
        return () => {
            unsubscribe(StorageEvent.SUMMARIES_UPDATED, handleSummariesUpdate);
        };
    }, []);

    return (
        <DrawerContentScrollView {...props}
            style={{ backgroundColor: theme.colors.background }}
        >
            <DrawerItem
                label="Settings"
                labelStyle={{color: theme.colors.onSurface}}
                icon={() => <Icon name="settings" size={24} color={theme.colors.onSurface} />}
                onPress={() => props.navigation.navigate('Settings')}
            />
            <Divider />
            {/* 历史对话列表 */}
            {summaries
                .sort((a, b) => b.lastConversation.localeCompare(a.lastConversation))
                .map(summary => (
                <DrawerItem
                    key={summary.id}
                    label={summary.summary}
                    labelStyle={{color: theme.colors.onSurface}}
                    icon={() => <Icon name="history" size={24} color={theme.colors.onSurface} />}
                    onPress={() => props.navigation.navigate('Home', {
                        conversationId: summary.id,
                        timestamp: Date.now()   // 添加时间戳强制更新
                    })}
                />
            ))}
        </DrawerContentScrollView>
    );
};

const HomeDrawer = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <DrawerMenu {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    backgroundColor: '#f5f5f5',
                    borderTopRightRadius: 20,
                    borderBottomRightRadius: 20,
                    overflow: 'hidden'
                },
                drawerActiveBackgroundColor: '#e0e0e0',
                drawerActiveTintColor: '#000',
                drawerInactiveTintColor: '#444'
            }}
        >
            <Drawer.Screen
                name="Home"
                component={HomePage}
                initialParams={{ conversationId: undefined }}
            />
        </Drawer.Navigator>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: 40,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    menuText: {
        fontSize: 18,
        marginLeft: 16,
    },
});

export default HomeDrawer;
