// DrawerMenu.tsx
import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import 'react-native-gesture-handler';
import {createDrawerNavigator, DrawerContentScrollView, DrawerItem, useDrawerStatus} from "@react-navigation/drawer";
import HomePage from "../home/HomePage.tsx";
import {ConversationSummary} from "../model/Conversation.ts";
import {getAllSummaries} from "../utils/Storage.ts";
import {useAppTheme} from "../theme/ThemeContext.tsx";
import {Divider} from "react-native-paper";

const Drawer = createDrawerNavigator();

const DrawerMenu = (props: any) => {
    const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
    const drawerStatus = useDrawerStatus(); // 获取抽屉状态
    const theme = useAppTheme();

    useEffect(() => {
        const loadSummaries = async () => {
            if (drawerStatus === 'open') {
                const data = await getAllSummaries();
                setSummaries(data);
            }
        };
        loadSummaries();
    }, [drawerStatus]); // 监听抽屉状态变化

    return (
        <DrawerContentScrollView {...props}>
            <DrawerItem
                label="Settings"
                icon={({ color }) => <Icon name="settings" size={24} color={color} />}
                onPress={() => props.navigation.navigate('Settings')}
            />
            <Divider />
            {/* 历史对话列表 */}
            {summaries.map(summary => (
                <DrawerItem
                    key={summary.id}
                    label={summary.summary}
                    icon={({ color }) => <Icon name="history" size={24} color={color} />}
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
