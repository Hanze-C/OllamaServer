import {StyleSheet} from "react-native";
import {useAppTheme} from "../../theme/ThemeContext.tsx";

export function getStyles() {
    const theme = useAppTheme();

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.surface,
        },
        safeArea: {
            flex: 1,
        },
        listItemContainer: {
            overflow: 'hidden',
            borderRadius: 64
        },
        drawerItemContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
        },
        icon: {
            marginRight: 12,
        },
        label: {
            fontSize: theme.fonts.bodyMedium.fontSize,
            fontWeight: theme.fonts.titleMedium.fontWeight
        },
        text: {
            color: theme.colors.onSurface
        },
    });

}
