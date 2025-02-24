package io.kindbrave.ollamaserver.utils

import android.content.Context
import java.io.File
import java.io.FileWriter
import java.io.IOException

class LogUtils private constructor(private val context: Context) {

    companion object {
        private const val LOG_FILE_NAME = "ollama.log"

        @Volatile
        private var instance: LogUtils? = null

        fun getInstance(context: Context): LogUtils {
            return instance ?: synchronized(this) {
                instance ?: LogUtils(context).also { instance = it }
            }
        }
    }

    private val logFile: File by lazy {
        val logDir = File(context.filesDir, "logs")
        if (!logDir.exists()) {
            logDir.mkdirs()
        }
        File(logDir, LOG_FILE_NAME).apply {
            if (!exists()) {
                createNewFile()
            }
        }
    }

    fun clearLogFile() {
        try {
            FileWriter(logFile, false).use { writer ->
                writer.write("")
            }
        } catch (e: IOException) {
            e.printStackTrace()
        }
    }

    fun log(message: String) {
        try {
            FileWriter(logFile, true).use { writer ->
                writer.write("$message\n")
            }
        } catch (e: IOException) {
            e.printStackTrace()
        }
    }
}
