// DrawerMenu.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {createDrawerNavigator} from "@react-navigation/drawer";
import HomePage from "../home/HomePage.tsx";

const Drawer = createDrawerNavigator();

const DrawerMenu = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
                <Icon name="settings" size={24} color="#000" />
                <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
        </View>
    );
};

const HomeDrawer = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <DrawerMenu {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Drawer.Screen name="Home" component={HomePage} />
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
