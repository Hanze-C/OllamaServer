package io.kindbrave.ollamaserver.module

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileInputStream

class LogSaveModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "LogSaveModule"
    }

    @ReactMethod
    fun saveLogToFile(logFilePath: String, promise: Promise) {
        try {
            val logFile = File(logFilePath)
            if (!logFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "Source log file does not exist")
                return
            }

            val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "text/plain"
                putExtra(Intent.EXTRA_TITLE, logFile.name)
            }

            val activity = currentActivity
            if (activity != null) {
                currentActivity?.startActivityForResult(
                    Intent.createChooser(intent, "Save Log File"),
                    REQUEST_CODE_SAVE_LOG
                )

                // Handle the result in onActivityResult
                reactContext.addActivityEventListener(object : BaseActivityEventListener() {
                    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
                        if (requestCode == REQUEST_CODE_SAVE_LOG && resultCode == Activity.RESULT_OK) {
                            data?.data?.let { uri ->
                                saveFileToUri(logFile, uri, promise)
                            } ?: run {
                                promise.reject("URI_ERROR", "Failed to get URI from intent")
                            }
                        } else {
                            promise.reject("USER_CANCELLED", "User cancelled the save operation")
                        }
                    }
                })
            } else {
                promise.reject("ACTIVITY_NULL", "Current activity is null")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error saving log file", e)
            promise.reject("SAVE_ERROR", e.message)
        }
    }

    private fun saveFileToUri(sourceFile: File, destinationUri: Uri, promise: Promise) {
        try {
            reactContext.contentResolver.openOutputStream(destinationUri)?.use { outputStream ->
                FileInputStream(sourceFile).use { inputStream ->
                    val buffer = ByteArray(8192)
                    var count: Int
                    while (inputStream.read(buffer).also { count = it } > 0) {
                        outputStream.write(buffer, 0, count)
                    }
                }
            }
            promise.resolve("Log file saved successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error writing to URI", e)
            promise.reject("WRITE_ERROR", e.message)
        }
    }

    companion object {
        private const val TAG = "LogSaveModule"
        private const val REQUEST_CODE_SAVE_LOG = 1001
    }
}
