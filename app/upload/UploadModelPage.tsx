import React, {useRef, useState} from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    ActivityIndicator, NativeModules, NativeEventEmitter,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from "../theme/ThemeContext.tsx";
import {Appbar, Button, Dialog, IconButton, List, Portal, ProgressBar, Snackbar, TextInput} from 'react-native-paper';
import { formatFileSize } from "../utils/FileUtils.ts";
const { HashModule, FileUploadModule } = NativeModules;
import * as DocumentPicker from 'expo-document-picker';
import {DocumentPickerAsset} from "expo-document-picker";
import {create} from "../api/OllamaApi.ts";

/**
 * import { uploadModel } from "../utils/OllamaApi.ts"; // 假设有一个 uploadModel 函数
 */

const UploadModelPage = () => {
    const theme = useAppTheme();
    const navigation = useNavigation();

    const [modelName, setModelName] = useState('');
    const [uploadingDialogVisible, setUploadingDialogVisible] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadInfo, setUploadInfo] = useState('');
    const [file, setFile] = useState<DocumentPickerAsset>();
    const [fileSha256, setFileSha256] = useState<string>('')
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    // Snackbar提示
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [loadingDialogVisible, setLoadingDialogVisible] = useState(false);

    const handleFileSelection = async () => {
        setLoadingDialogVisible(true);
        await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: false
        }).then((result)=>{
            if (result.assets) {
                if (result.assets[0].name.endsWith('.gguf')) {
                    const ggufFile = result.assets[0]
                    setFile(ggufFile)
                    setModelName(ggufFile.name ? ggufFile.name.replace(/\.gguf$/, '') : 'Unknown File')
                    HashModule.calculateSHA256(ggufFile.uri)
                        .then((hash: string) => {
                            setFileSha256(hash);
                        })
                        .catch((err: any) => {
                            setSnackbarMessage('Calculate SHA-256 error');
                            setSnackbarVisible(true);
                        })
                } else {
                    setSnackbarMessage('Please select a .gguf file')
                    setSnackbarVisible(true)
                }
            }
        }).catch((error)=>{
            console.log(error)
            setSnackbarMessage('Select .gguf file error')
            setSnackbarVisible(true)
            setLoadingDialogVisible(false);
        }).finally(()=>{
            setLoadingDialogVisible(false);
        })
    };

    const handleUpload = async () => {
        if (!modelName || !file) {
            setSnackbarMessage('Please enter model name and select a file')
            setSnackbarVisible(true)
            return;
        }

        try {
            await FileUploadModule.uploadFile(
                file.uri,
                fileSha256,
            )
            setUploadingDialogVisible(true);
            setUploadInfo('Uploading...')
            create(
                modelName,
                {
                    [file.name]: `sha256:${fileSha256}`
                },
                (response)=>{
                    setUploadInfo(response.status)
                }
            )
                .then((res)=>{
                    setSnackbarMessage('Create model successful')
                    setSnackbarVisible(true)
                })
                .catch((err)=>{
                    setSnackbarMessage('Create model failed')
                    setSnackbarVisible(true)
                })
                .finally(()=>{
                    setUploadingDialogVisible(false);
                })
        } catch (error) {
            console.error('Upload failed:', error);
            setSnackbarMessage('Upload error');
            setSnackbarVisible(true)
            setUploadInfo('Upload failed');
        }
    };

    const styles = StyleSheet.create({
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
    });

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <Appbar.Header mode={'center-aligned'}>
                    <Appbar.BackAction onPress={() => navigation.goBack()} />
                    <Appbar.Content title="Upload Model" />
                </Appbar.Header>

                <ScrollView style={styles.uploadContainer}>
                    <TextInput
                        mode="outlined"
                        label="Enter the model name"
                        onChangeText={(text) => setModelName(text)}
                        value={modelName}
                        style={{ marginVertical: 8 }}
                    />
                    {file && (
                        <View>
                            <Text style={styles.text}>
                                Selected File: {file.name}
                            </Text>
                            <Text style={styles.text}>
                                File Size: {formatFileSize(file.size ? file.size : 0)}
                            </Text>
                            <Text style={styles.text}>
                                File SHA256: {fileSha256}
                            </Text>
                        </View>
                    )}
                    <Button mode="contained" onPress={handleFileSelection} style={{ marginVertical: 8 }}>
                        Select File
                    </Button>
                    <Button mode="contained" onPress={handleUpload} style={{ marginVertical: 8 }}>
                        Upload
                    </Button>
                </ScrollView>
                <Portal>
                    <Dialog visible={loadingDialogVisible}>
                        <Dialog.Title>Waiting</Dialog.Title>
                        <Dialog.Content>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <Text style={[styles.text, { flex: 1 }]}>
                                    Loading model file {file?.name}...
                                </Text>
                                <ActivityIndicator
                                    animating={true}
                                    color={theme.colors.primary}
                                    size={'large'}
                                />
                            </View>
                        </Dialog.Content>
                    </Dialog>
                </Portal>
                <Portal>
                    <Dialog visible={uploadingDialogVisible}>
                        <Dialog.Title>Uploading</Dialog.Title>
                        <Dialog.Content>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <Text style={[styles.text, { flex: 1 }]}>
                                    {uploadInfo}
                                </Text>
                                <ActivityIndicator
                                    animating={true}
                                    color={theme.colors.primary}
                                    size={'large'}
                                />
                            </View>
                        </Dialog.Content>
                    </Dialog>
                </Portal>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                >
                    {snackbarMessage}
                </Snackbar>
            </SafeAreaView>
        </View>
    );
};

export default UploadModelPage;
