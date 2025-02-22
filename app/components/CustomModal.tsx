import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Animated
} from 'react-native';

interface CustomModalProps {
    visible: boolean;
    onRequestClose: () => void;
    title: string;
    msg: string;
    onCancel: () => void;
    onConfirm: () => void;
}

interface CustomWithInputModalProps {
    visible: boolean;
    onRequestClose: () => void;
    title: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
      visible,
      onRequestClose,
      title,
      msg,
      onCancel,
      onConfirm,
  }) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={onRequestClose}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.info}>{msg}</Text>
                    <View style={styles.modalMessageSpacing} />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={onCancel}>
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={onConfirm}>
                            <Text style={styles.modalButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const CustomWithInputModal: React.FC<CustomWithInputModalProps> = ({
    visible,
    onRequestClose,
    title,
    placeholder,
    value,
    onChangeText,
    onCancel,
    onConfirm,
}) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={onRequestClose}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        value={value}
                        onChangeText={onChangeText}
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={onCancel}>
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={onConfirm}>
                            <Text style={styles.modalButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

interface CustomProgressBarModalProps {
    visible: boolean;
    onRequestClose: () => void;
    title: string;
    progress: string;
    info: string;
}

const CustomProgressBarModal: React.FC<CustomProgressBarModalProps> = ({
    visible,
    onRequestClose,
    title,
    progress,
    info,
}) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;
    React.useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: parseInt(progress),
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    return (
        <Modal
            visible={visible}
            onRequestClose={onRequestClose}
            transparent={true}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.info}>{info}</Text>
                    <View style={styles.progressBarContainer}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    width: animatedValue.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ['0%', '100%']
                                    })
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

interface CustomProgressBarModalWithoutProgressProps {
    visible: boolean;
    onRequestClose: () => void;
    title: string;
    info: string;
}

const CustomProgressBarWithoutProgressModal: React.FC<CustomProgressBarModalWithoutProgressProps> = ({
       visible,
       onRequestClose,
       title,
       info,
   }) => {
    const translateX = React.useRef(new Animated.Value(-100)).current;
    React.useEffect(() => {
        if (visible) {
            startAnimation();
        }
    }, [visible]);

    const startAnimation = () => {
        Animated.sequence([
            Animated.timing(translateX, {
                toValue: 100,
                duration: 1000,
                useNativeDriver: true,
            })
        ]).start(() => {
            translateX.setValue(-100);
            startAnimation();
        });
    };

    return (
        <Modal
            visible={visible}
            onRequestClose={onRequestClose}
            transparent={true}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.info}>{info}</Text>
                    <View style={styles.progressBarContainer}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    transform: [{
                                        translateX: translateX.interpolate({
                                            inputRange: [-100, 100],
                                            outputRange: ['-100%', '100%']
                                        })
                                    }]
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 4,
        padding: 8,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        marginLeft: 16,
    },
    modalButtonText: {
        fontSize: 16,
        color: '#007AFF',
    },
    // 添加样式以提供空白
    modalMessageSpacing: {
        height: 16, // 根据需要调整高度
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    info: {
        marginTop: 10,
        fontSize: 16,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 20,
    },
    progressBar: {
        height: '100%',
        backgroundColor: "#2563eb",
        borderRadius: 10,
    },
});

export { CustomModal, CustomWithInputModal, CustomProgressBarModal, CustomProgressBarWithoutProgressModal };
