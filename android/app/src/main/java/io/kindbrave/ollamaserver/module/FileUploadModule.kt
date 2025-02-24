package io.kindbrave.ollamaserver.module

import android.app.Activity
import android.util.Log
import android.view.View
import android.widget.ProgressBar
import android.widget.SeekBar
import androidx.appcompat.app.AlertDialog
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.constraintlayout.widget.ConstraintSet
import androidx.core.net.toUri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.progressindicator.LinearProgressIndicator
import io.kindbrave.ollamaserver.utils.Api.OLLAMA_SERVICE_URL
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okio.BufferedSink
import java.io.IOException
import kotlin.math.roundToInt

class FileUploadModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(
        reactContext
    ) {
    override fun getName(): String {
        return "FileUploadModule"
    }

    @ReactMethod
    fun uploadFile(uriString: String?, sha256: String?, promise: Promise) {
        if (uriString == null || sha256 == null) {
            promise.reject("INVALID_PARAMETERS", "uriString and sha256 must be provided")
            return
        }
        if (currentActivity == null) {
            promise.reject("INVALID_PARAMETERS", "currentActivity is null")
            return
        }

        val progressIndicator = LinearProgressIndicator(currentActivity!!)
        progressIndicator.apply {
            isIndeterminate = false
            max = 100
        }

        currentActivity!!.runOnUiThread {
            val dialogView = ConstraintLayout(currentActivity!!)
            val params = ConstraintLayout.LayoutParams(
                ConstraintLayout.LayoutParams.MATCH_PARENT,
                ConstraintLayout.LayoutParams.WRAP_CONTENT
            )
            progressIndicator.id = View.generateViewId()
            dialogView.addView(progressIndicator, params)

            val constraintSet = ConstraintSet()
            constraintSet.clone(dialogView)
            constraintSet.connect(
                progressIndicator.id,
                ConstraintSet.START,
                ConstraintLayout.LayoutParams.PARENT_ID,
                ConstraintSet.START,
                16 // 左边距为16dp
            )
            constraintSet.connect(
                progressIndicator.id,
                ConstraintSet.END,
                ConstraintLayout.LayoutParams.PARENT_ID,
                ConstraintSet.END,
                16 // 右边距为16dp
            )
            constraintSet.applyTo(dialogView)
            
            val builder = MaterialAlertDialogBuilder(currentActivity!!).apply {
                setTitle("Uploading File")
                setMessage("Please wait...")
                setView(dialogView)
                setCancelable(false)
            }
            val dialog = builder.create()
            dialog.show()

            Thread(Runnable {
                try {
                    val uri = uriString.toUri()
                    val resolver = reactContext.contentResolver

                    // 创建OkHttp客户端
                    val client = OkHttpClient.Builder().build()

                    // 获取文件长度
                    val parcelFileDescriptor = resolver.openFileDescriptor(uri, "r")
                    val fileLength = parcelFileDescriptor!!.statSize
                    parcelFileDescriptor.close()

                    // 构建请求体
                    val requestBody: RequestBody = object : RequestBody() {
                        override fun contentType(): MediaType {
                            return "application/octet-stream".toMediaType()
                        }

                        @Throws(IOException::class)
                        override fun contentLength(): Long {
                            return fileLength
                        }

                        @Throws(IOException::class)
                        override fun writeTo(sink: BufferedSink) {
                            resolver.openInputStream(uri).use { input ->
                                val buffer = ByteArray(4096)
                                var read: Int
                                var uploaded = 0L
                                while ((input!!.read(buffer).also { read = it }) != -1) {
                                    sink.write(buffer, 0, read)
                                    uploaded += read.toLong()
                                    val progress = uploaded * 100.0 / fileLength
                                    currentActivity!!.runOnUiThread {
                                        progressIndicator.progress = progress.roundToInt()
                                    }
                                }
                            }
                        }
                    }

                    // 构建请求
                    val request = Request.Builder()
                        .url("$OLLAMA_SERVICE_URL/api/blobs/sha256:$sha256")
                        .post(requestBody)
                        .build()

                    // 执行请求
                    val response = client.newCall(request).execute()
                    if (response.isSuccessful) {
                        currentActivity!!.runOnUiThread {
                            dialog.dismiss()
                            promise.resolve(true)
                        }
                    } else {
                        currentActivity!!.runOnUiThread {
                            dialog.dismiss()
                            promise.reject("UPLOAD_FAILED", "Code: " + response.code)
                        }
                    }
                } catch (e: Exception) {
                    currentActivity!!.runOnUiThread {
                        dialog.dismiss()
                        promise.reject("UPLOAD_ERROR", e)
                    }
                }
            }).start()
        }
    }
}
