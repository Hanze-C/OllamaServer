package io.kindbrave.ollamaserver.utils

import android.content.Context
import android.os.Build
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.io.IOException
import java.net.Socket

class OllamaExecutor(private val context: Context) {

    companion object {
        private const val BINARY_NAME = "ollama"
        private const val PREFS_NAME = "ollama_prefs"
        private const val PREF_INIT_DONE = "init_done" // 初始化状态标记

        private const val OLLAMA_PORT = 11434
        private const val HOST = "127.0.0.1"

        fun ollamaRunning(): Boolean {
            return try {
                Socket(HOST, OLLAMA_PORT).use { true }
            } catch (e: Exception) {
                false
            }
        }
    }

    // 带状态检查的初始化方法
    fun setupEnvironment(): Boolean {
        return if (isInitializationDone()) {
            true // 已初始化直接返回成功
        } else {
            performInitialization() // 执行实际初始化
        }
    }

    private fun isInitializationDone(): Boolean {
        // 检查初始化标记和关键文件是否存在
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val markedDone = prefs.getBoolean(PREF_INIT_DONE, false)

        val binFile = File(getBinaryDir(), BINARY_NAME)
        val homeDir = getHomeDir()

        return markedDone && binFile.exists() && binFile.canExecute() && homeDir.exists()
    }

    private fun performInitialization(): Boolean {
        return try {
            // 创建必要目录
            getBinaryDir().takeIf { !it.exists() }?.mkdirs()
            getHomeDir().takeIf { !it.exists() }?.mkdirs()

            // 复制二进制文件
            copyBinaryFile()

            // 设置初始化完成标记
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().apply {
                putBoolean(PREF_INIT_DONE, true)
                apply()
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    private fun copyBinaryFile() {
        val targetFile = File(getBinaryDir(), BINARY_NAME)
        if (targetFile.exists()) {
            // 存在则先删除旧版本（可选）
            targetFile.delete()
        }

        // 根据设备架构选择正确的二进制文件路径
        val assetPath = when (Build.SUPPORTED_ABIS.firstOrNull()) {
            "arm64-v8a" -> "arm64-v8a/$BINARY_NAME"
            "armeabi-v7a" -> "armeabi-v7a/$BINARY_NAME"
            else -> throw IOException("Unsupported ABI")
        }

        context.assets.open(assetPath).use { input ->
            targetFile.outputStream().use { output ->
                input.copyTo(output)
            }
        }

        // 设置可执行权限（重试机制）
        if (!targetFile.setExecutable(true)) {
            throw IOException("Failed to set executable permission")
        }
    }

    // 获取二进制文件目录（隔离不同架构）
    private fun getBinaryDir(): File {
        val abi = when (Build.SUPPORTED_ABIS.firstOrNull()) {
            "arm64-v8a" -> "arm64-v8a"
            "armeabi-v7a" -> "armeabi-v7a"
            else -> throw IOException("Unsupported ABI")
        }
        return File(context.filesDir, "bin/$abi").apply {
            mkdirs()
        }
    }

    private fun getHomeDir() = context.filesDir

    fun startOllamaService(): Process? {
        return try {
            LogUtils.getInstance(context).clearLogFile()

            val nativeLibDir = context.applicationInfo.nativeLibraryDir
            val binaryPath = File("${getBinaryDir()}/$BINARY_NAME").absolutePath
            val homeDir = getHomeDir().absolutePath

            val processBuilder = ProcessBuilder(binaryPath, "serve")
                .directory(context.filesDir)
                .redirectErrorStream(true) // 合并 stderr 到 stdout

            // 设置环境变量
            val env = processBuilder.environment()
            env["LD_LIBRARY_PATH"] = "$nativeLibDir:${env["LD_LIBRARY_PATH"] ?: ""}"
            env["HOME"] = homeDir
            env["OLLAMA_DEBUG"] = "1"

            processBuilder.start().also { process ->
                // 必须处理输出流，建议在单独线程中异步处理
                Thread { consumeProcessOutput(process) }.start()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun consumeProcessOutput(process: Process) {
        CoroutineScope(Dispatchers.IO).launch {
            process.inputStream.bufferedReader().use { reader ->
                while (process.isAlive) {
                    try {
                        reader.readLine()?.let { line ->
                            LogUtils.getInstance(context).log(line)
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }
    }

    // 添加停止服务的方法（如果需要）
    fun stopOllamaService(process: Process?) {
        process?.destroy()
    }
}