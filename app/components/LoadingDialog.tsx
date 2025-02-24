import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Dialog, Portal, useTheme } from 'react-native-paper';

interface LoadingDialogProps {
    visible: boolean;
    onDismiss?: () => void;
    title?: string;
    message: string;
}

const LoadingDialog = ({
                           visible,
                           onDismiss,
                           title = 'Waiting',
                           message
                       }: LoadingDialogProps) => {
    const theme = useTheme();

    const styles = {
        text: {
            color: theme.colors.onSurface
        }
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss}>
                <Dialog.Title>{title}</Dialog.Title>
                <Dialog.Content>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.text, { flex: 1 }]}>{message}</Text>
                        <ActivityIndicator
                            animating={true}
                            color={theme.colors.primary}
                            size="large"
                        />
                    </View>
                </Dialog.Content>
            </Dialog>
        </Portal>
    );
};

export default LoadingDialog;
