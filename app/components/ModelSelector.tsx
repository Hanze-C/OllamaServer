import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
    Text,
    Modal,
    FlatList,
    ActivityIndicator,
    Animated,
} from 'react-native';
import {tags} from "../utils/OllamaApi.ts";
import Icon from "react-native-vector-icons/MaterialIcons";

const ModelSelector = ({ onModelSelect = (model: OllamaModel) => {}, currentModel = 'AI Assistant' }) => {
    const [visible, setVisible] = useState(false);
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Animation value for rotate transform
    const rotateAnimation = new Animated.Value(0);

    const rotate = rotateAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '90deg']
    });

    const toggleDropdown = () => {
        setVisible(!visible);
        Animated.timing(rotateAnimation, {
            toValue: visible ? 0 : 1,
            duration: 200,
            useNativeDriver: true
        }).start();

        if (!visible) {
            fetchModels();
        }
    };

    const fetchModels = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await tags()
            setModels(response.models);
        } catch (err) {
            setError('err');
        } finally {
            setLoading(false);
        }
    };

    const handleModelSelect = (model: OllamaModel) => {
        onModelSelect(model);
        setVisible(false);
        rotateAnimation.setValue(0);
    };

    const renderModel = ({ item }: { item: OllamaModel }) => (
        <TouchableOpacity
            style={styles.modelItem}
            onPress={() => handleModelSelect(item)}
        >
            <Text style={styles.modelText}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleDropdown}
                activeOpacity={0.7}
            >
                <Text style={styles.headerText}>{currentModel}</Text>
                {/*<Animated.View style={{ transform: [{ rotate }] }}>*/}
                {/*    <Icon*/}
                {/*        name="keyboard-arrow-down"*/}
                {/*        size={24}*/}
                {/*        color="#666"*/}
                {/*    />*/}
                {/*</Animated.View>*/}
                <Icon
                    name="keyboard-arrow-down"
                    size={24}
                    color="#666"
                />
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent={true}
                animationType="fade"
                onRequestClose={toggleDropdown}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={toggleDropdown}
                >
                    <View style={styles.dropdownContainer}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#0066cc" />
                                <Text style={styles.loadingText}>Loading models...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={models}
                                renderItem={renderModel}
                                keyExtractor={(item, index) => index.toString()}
                                bounces={false}
                                showsVerticalScrollIndicator={true}
                                style={styles.modelList}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: 'white',
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    arrow: {
        fontSize: 14,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
    },
    dropdownContainer: {
        backgroundColor: 'white',
        marginTop: 50,
        marginHorizontal: 20,
        borderRadius: 10,
        maxHeight: '50%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modelList: {
        flexGrow: 0,
    },
    modelItem: {
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    modelText: {
        fontSize: 16,
        color: '#333',
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        color: '#ff3b30',
    },
});

export default ModelSelector;
