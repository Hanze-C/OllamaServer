import { Material3Scheme, Material3Theme, useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { createContext, useContext } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import {
    MD3DarkTheme,
    MD3LightTheme,
    MD3Theme,
    Provider as PaperProvider,
    ProviderProps,
    useTheme,
} from 'react-native-paper';

type Material3ThemeProviderProps = {
    theme: Material3Theme;
    updateTheme: (sourceColor: string) => void;
    resetTheme: () => void;
};

type CustomColors = {
    link: string;
};

const lightCustomColors: CustomColors = {
    link: '#0366D6'
};

const darkCustomColors: CustomColors = {
    link: '#58A6FF'
};

type AppTheme = MD3Theme & {
    colors: Material3Scheme;
    customColors: CustomColors;
};

const Material3ThemeProviderContext = createContext<Material3ThemeProviderProps>({} as Material3ThemeProviderProps);

export function Material3ThemeProvider({
                                           children,
                                           sourceColor,
                                           fallbackSourceColor,
                                           ...otherProps
                                       }: ProviderProps & { sourceColor?: string; fallbackSourceColor?: string }) {
    const colorScheme = useColorScheme();

    const { theme, updateTheme, resetTheme } = useMaterial3Theme({
        sourceColor,
        fallbackSourceColor,
    });

    const paperTheme = {
        ...(colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme),
        colors: colorScheme === 'dark' ? theme.dark : theme.light,
        // 可选：保留独立的自定义颜色对象
        customColors: colorScheme === 'dark' ? darkCustomColors : lightCustomColors
    } as AppTheme;

    return (
        <Material3ThemeProviderContext.Provider value={{ theme, updateTheme, resetTheme }}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            <PaperProvider theme={paperTheme} {...otherProps}>
                {children}
            </PaperProvider>
        </Material3ThemeProviderContext.Provider>
    );
}

export function useMaterial3ThemeContext() {
    const ctx = useContext(Material3ThemeProviderContext);
    if (!ctx) {
        throw new Error('useMaterial3ThemeContext must be used inside Material3ThemeProvider');
    }
    return ctx;
}

export const useAppTheme = useTheme<AppTheme>;
