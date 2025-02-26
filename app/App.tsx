import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsPage from './settings/SettingsPage.tsx';
import LogPage from './logs/LogPage.tsx';
import HomeDrawer from "./components/drawer/DrawerMenu.tsx";
import {Material3ThemeProvider} from "./theme/ThemeContext.tsx";
import {SafeAreaProvider} from "react-native-safe-area-context";
import UploadModelPage from "./upload/UploadModelPage.tsx";
import './i18n/i18next';
import {logger} from "./utils/LogUtils.ts";

const Stack = createNativeStackNavigator();

const App = () => {
    return (
        <SafeAreaProvider>
            <Material3ThemeProvider>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="Home">
                        <Stack.Screen name="Home" component={HomeDrawer} options={{ headerShown: false }} />
                        <Stack.Screen name="Settings" component={SettingsPage} options={{ headerShown: false }} />
                        <Stack.Screen name="Logs" component={LogPage} options={{ headerShown: false }} />
                        <Stack.Screen name="UploadModel" component={UploadModelPage} options={{ headerShown: false }} />
                    </Stack.Navigator>
                </NavigationContainer>
            </Material3ThemeProvider>
        </SafeAreaProvider>

  );
};

export default App;
