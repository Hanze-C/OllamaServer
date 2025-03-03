import {StyleSheet} from "react-native";
import {useAppTheme} from "../theme/ThemeContext.tsx";

export const getStyles = () => {
    const theme = useAppTheme();

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.surface,
        },
        safeArea: {
            flex: 1,
        },
        uploadContainer: {
            paddingHorizontal: 16,
        },
        text: {
            color: theme.colors.onSurface,
        },
        advancedSettingsContainer: {
            marginTop: 16,
            padding: 16,
            backgroundColor: theme.colors.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.outline,
        },
        advancedSettingsTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 8,
            color: theme.colors.onBackground,
        },
    });
}
