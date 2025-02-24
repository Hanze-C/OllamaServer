import React, {useState, useEffect, useRef} from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    NativeModules, ToastAndroid, ScrollView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {deleteModel, ps, pull, tags, unload} from "../api/OllamaApi.ts";
import {useAppTheme} from "../theme/ThemeContext.tsx";
import {Appbar, Button, Dialog, IconButton, List, Portal, ProgressBar, TextInput} from 'react-native-paper';
import {OLLAMA_SERVER} from "../api/API.ts";
import {formatFileSize} from "../utils/FileUtils.ts";

let ollamaServiceModule = NativeModules.OllamaServiceModule;

const SettingsPage = () => {
    const theme = useAppTheme();

    const navigation = useNavigation();
    const DEEPSEEK = 'deepseek-r1:1.5b';
    const [modelName, setModelName] = useState(DEEPSEEK);
    const [downloadModelVisible, setDownloadModelVisible] = useState(false);
    const [startingServerDialogVisible, setStartingServerDialogVisible] = useState(false)
    const [closeServerVisible, setCloseServerVisible] = useState(false)
    const [serverRunning, setServerRunning] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadProgressModelVisible, setDownloadProgressModelVisible] = useState(false);
    const [downloadInfo, setDownloadInfo] = useState('');
    const [modelListDialogVisible, setModelListDialogVisible] = useState(false)
    const [modelList, setModelList] = useState<OllamaModel[]>([])
    //删除模型确认对话框
    const [deleteModelDialogVisible, setDeleteModelDialogVisible] = useState(false)
    //删除模型名称
    const [deleteModelName, setDeleteModelName] = useState('');
    //删除模型中对话框
    const [deletingModelDialogVisible, setDeletingModelDialogVisible] = useState(false)
    //正在运行的模型对话框
    const [runningModelDialogVisible, setRunningModelDialogVisible] = useState(false)
    //正在运行的模型
    const [runningModelList, setRunningModelList] = useState<OllamaRunningModel[]>([])
    //关闭正在运行模型对话框
    const [unloadModelDialogVisible, setUnloadModelDialogVisible] = useState(false)

    const checkServerStatus = async (): Promise<boolean> => {
        try {
            const response = await fetch(OLLAMA_SERVER);
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    useEffect(() => {
        const initializeServerStatus = async () => {
            const isRunning = await checkServerStatus();
            setServerRunning(isRunning);
        };

        initializeServerStatus();

        const intervalId = setInterval(async () => {
            const isRunning = await checkServerStatus();
            setServerRunning(isRunning);
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    const handleServerStatus = async () => {
        if (serverRunning) {
            setCloseServerVisible(true)
        } else {
            ollamaServiceModule.startService();
            setStartingServerDialogVisible(true);
            // 轮询检测Ollama服务是否启动
            const pollingInterval = setInterval(async () => {
                if (await checkServerStatus()) {
                    clearInterval(pollingInterval);
                    clearTimeout(timeoutId);
                    setServerRunning(true);
                    setStartingServerDialogVisible(false);
                }
            }, 1000); // 每秒检测一次
            // 超时处理
            const timeoutId = setTimeout(() => {
                clearInterval(pollingInterval);
                setStartingServerDialogVisible(false);
                ToastAndroid.show('Ollama Server start timeout', ToastAndroid.SHORT)
            }, 10000); // 10秒超时
            // 清理函数
            return () => {
                clearInterval(pollingInterval);
                clearTimeout(timeoutId);
            };
        }
    };

    const handleCloseServer = () => {
        setCloseServerVisible(false)
        ollamaServiceModule.stopService();
        setServerRunning(false)
    };

    const handleConfirmDownload = async () => {
        if (modelName) {
            setDownloadProgress(0);
            setDownloadInfo('Starting download...');
            setDownloadModelVisible(false);
            setDownloadProgressModelVisible(true)
            await pull(modelName, (pullResponse: PullResponse) => {
                if (pullResponse.completed != null && pullResponse.total != null) {
                    setDownloadProgress(pullResponse.completed / pullResponse.total)
                }
                setDownloadInfo(pullResponse.status);
            }).catch(e => {
                ToastAndroid.show('Error: ' + e.message, ToastAndroid.SHORT);
            })
            setDownloadProgressModelVisible(false)
        }
    };

    //获取模型列表
    const handleModelList = () => {
        setModelListDialogVisible(true)
        tags()
            .then((response) => {
                setModelList(response.models)
            })
            .catch((err)=>{
                ToastAndroid.show('Error: ' + err.message, ToastAndroid.SHORT)
            })
    };

    // 处理删除模型对话框展示
    const handleDeleteModelDialog = (modelName: string) => {
        setDeleteModelName(modelName)
        setDeleteModelDialogVisible(true)
    };

    // 处理删除模型逻辑
    const handleDeleteModel = () => {
        setDeleteModelDialogVisible(false)
        setDeletingModelDialogVisible(true)
        deleteModel(deleteModelName)
            .catch((err)=>{
                ToastAndroid.show(`Delete Model ${deleteModelName} error`, ToastAndroid.SHORT)
            })
            .finally(()=>{
                setDeletingModelDialogVisible(false)
                handleModelList()
            })
    };

    // 处理正在运行的模型
    const handleRunningModel = () => {
        setRunningModelDialogVisible(true)
        ps()
            .then((response)=>{
                setRunningModelList(response.models)
            })
            .catch((err)=>{
                ToastAndroid.show(`Get Running Model error`, ToastAndroid.SHORT)
            })
    }

    // 处理关闭运行模型
    const handleUnloadModel = (model: OllamaRunningModel) => {
        setUnloadModelDialogVisible(true)
        unload(model.name)
            .then((response)=>{
                if (response.done && response.done_reason == 'unload') {
                    // 因为模型关闭后立刻获取运行列表可能还会获取到，所以先过滤掉
                    setRunningModelList(runningModelList.filter((runningModel)=>runningModel != model))
                } else {
                    ToastAndroid.show(`Unload Model ${model.name} error`, ToastAndroid.SHORT)
                }
            })
            .catch((err)=>{
                ToastAndroid.show(`Unload Model ${model.name} error`, ToastAndroid.SHORT)
            })
            .finally(()=>{
                setUnloadModelDialogVisible(false)
            })
    }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.surface,
        },
        safeArea: {
            flex: 1,
        },
        settingsContainer: {
            paddingHorizontal: 16,
        },
        text: {
            color: theme.colors.onSurface
        }
    });

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <Appbar.Header mode={'center-aligned'}>
                    <Appbar.BackAction onPress={() => {navigation.goBack()}} />
                    <Appbar.Content title="Settings"/>
                </Appbar.Header>

                <List.Section style={styles.settingsContainer}>
                    <List.Subheader>Server Settings</List.Subheader>
                    <List.Item
                        title="Ollama Server Status"
                        left={() => <List.Icon icon="server" />}
                        description={serverRunning ? 'Ollama Server is Running' : 'Click to Start Ollama Server'}
                        onPress={handleServerStatus}
                    />
                    <List.Item
                        title="Server Log"
                        left={() => <List.Icon icon="note-text" />}
                        onPress={()=>{
                            // @ts-ignore
                            navigation.navigate('Logs')
                        }}
                    />
                    {serverRunning && (
                        <View>
                            <List.Subheader>Model Settings</List.Subheader>
                            <List.Item
                                title="Download Model"
                                left={() => <List.Icon icon="cloud-download" />}
                                onPress={()=>{setDownloadModelVisible(true)}}
                            />
                            <List.Item
                                title="Upload Model"
                                description="Upload custom .gguf model file to Ollama server"
                                left={() => <List.Icon icon="upload" />}
                                onPress={()=>{
                                    // @ts-ignore
                                    navigation.navigate('UploadModel')
                                }}
                            />
                            <List.Item
                                title="Model List"
                                left={() => <List.Icon icon="format-list-text" />}
                                onPress={handleModelList}
                            />
                            <List.Item
                                title="Running Model"
                                left={() => <List.Icon icon="rocket-launch" />}
                                onPress={handleRunningModel}
                            />
                        </View>
                    )}
                </List.Section>

                <Portal>
                    <Dialog visible={closeServerVisible}>
                        <Dialog.Title>Close Server</Dialog.Title>
                        <Dialog.Content>
                            <Text style={styles.text}>Do you want to close server?</Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => handleCloseServer()}>Ok</Button>
                            <Button onPress={() => setCloseServerVisible(false)}>Cancel</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
                <Portal>
                    <Dialog visible={downloadModelVisible} onDismiss={()=>{setDownloadModelVisible(false)}}>
                        <Dialog.Title>Download Model</Dialog.Title>
                        <TextInput
                            mode="outlined"
                            label="Enter the model information"
                            onChangeText={(text)=>{setModelName(text)}}
                            placeholder={DEEPSEEK}
                            defaultValue={modelName}
                            style={{ marginHorizontal: 16, marginVertical: 8 }}
                        />
                        <Dialog.Actions>
                            <Button onPress={() => setDownloadModelVisible(false)}>Cancel</Button>
                            <Button onPress={() => handleConfirmDownload()}>Ok</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
                <Portal>
                    <Dialog visible={downloadProgressModelVisible}>
                        <Dialog.Title>Downloading {modelName}</Dialog.Title>
                        <Dialog.Content>
                            <Text style={styles.text}>{downloadInfo}</Text>
                            <ProgressBar progress={downloadProgress} color={theme.colors.primary} />
                        </Dialog.Content>
                    </Dialog>
                </Portal>
                <Portal>
                    <Dialog visible={startingServerDialogVisible}>
                        <Dialog.Title>Waiting</Dialog.Title>
                        <Dialog.Content>
                            <Text style={styles.text}>Ollama server is starting...</Text>
                        </Dialog.Content>
                    </Dialog>
                </Portal>
                <Portal>
                    <Dialog visible={modelListDialogVisible} onDismiss={() => {setModelListDialogVisible(false)}}>
                        <Dialog.Title>Model List</Dialog.Title>
                        <Dialog.ScrollArea>
                            <ScrollView>
                                {modelList.map(model => (
                                    <List.Item
                                        key={model.name}
                                        title={model.name}
                                        description={formatFileSize(model.size)}
                                        right={()=>(
                                            <IconButton
                                                icon="delete"
                                                iconColor={theme.colors.error}
                                                onPress={()=>{handleDeleteModelDialog(model.name)}}
                                            />
                                        )}
                                    />
                                ))}
                            </ScrollView>
                        </Dialog.ScrollArea>
                        <Dialog.Actions>
                            <Button onPress={() => setModelListDialogVisible(false)}>Ok</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
                <Portal>
                    <Dialog visible={deleteModelDialogVisible}>
                        <Dialog.Title>Delete Model</Dialog.Title>
                        <Dialog.Content>
                            <Text style={styles.text}>Do you want to delete {deleteModelName}?</Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => handleDeleteModel()}>Ok</Button>
                            <Button onPress={() => setDeleteModelDialogVisible(false)}>Cancel</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
                <Portal>
                    <Dialog visible={deletingModelDialogVisible}>
                        <Dialog.Title>Waiting</Dialog.Title>
                        <Dialog.Content>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <Text style={[styles.text, { flex: 1 }]}>
                                    Deleting Model {deleteModelName}...
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
                    <Dialog visible={runningModelDialogVisible} onDismiss={() => {setRunningModelDialogVisible(false)}}>
                        <Dialog.Title>Running Model</Dialog.Title>
                        <Dialog.ScrollArea>
                            <ScrollView>
                                {runningModelList.map(model => (
                                    <List.Item
                                        key={model.name}
                                        title={model.name}
                                        description={formatFileSize(model.size)}
                                        right={()=>(
                                            <IconButton
                                                icon="stop-circle-outline"
                                                iconColor={theme.colors.error}
                                                onPress={()=>{handleUnloadModel(model)}}
                                            />
                                        )}
                                    />
                                ))}
                            </ScrollView>
                        </Dialog.ScrollArea>
                        <Dialog.Actions>
                            <Button onPress={() => setRunningModelDialogVisible(false)}>Ok</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
                <Portal>
                    <Dialog visible={unloadModelDialogVisible}>
                        <Dialog.Title>Waiting</Dialog.Title>
                        <Dialog.Content>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <Text style={[styles.text, { flex: 1 }]}>
                                    Unloading Model...
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
            </SafeAreaView>
        </View>
    );
};

export default SettingsPage;
