package io.kindbrave.ollamaserver.module

import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.security.MessageDigest

class HashModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(
    reactContext
) {
    override fun getName(): String {
        return "HashModule"
    }

    @ReactMethod
    fun calculateSHA256(uriString: String?, promise: Promise) {
        try {
            val uri = Uri.parse(uriString)
            val resolver = reactContext.getContentResolver()

            val digest = MessageDigest.getInstance("SHA-256")
            val buffer = ByteArray(8192)
            var count: Int

            resolver.openInputStream(uri).use { inputStream ->
                if (inputStream == null) {
                    promise.reject("FILE_ERROR", "Cannot open input stream")
                    return
                }
                while ((inputStream.read(buffer).also { count = it }) > 0) {
                    digest.update(buffer, 0, count)
                }

                val hashBytes = digest.digest()
                val hexString = StringBuilder()
                for (b in hashBytes) {
                    val hex = Integer.toHexString(0xff and b.toInt())
                    if (hex.length == 1) hexString.append('0')
                    hexString.append(hex)
                }
                promise.resolve(hexString.toString())
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error calculating hash", e)
            promise.reject("HASH_ERROR", e.message)
        }
    }

    companion object {
        private const val TAG = "HashModule"
    }
}