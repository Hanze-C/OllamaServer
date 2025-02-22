package io.kindbrave.ollamaserver.module

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import io.kindbrave.ollamaserver.service.OllamaService

class OllamaServiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(
        reactContext
    ) {
    private val intent: Intent = Intent(reactContext, OllamaService::class.java)

    override fun getName(): String {
        return "OllamaServiceModule"
    }

    @ReactMethod
    fun startService() {
        reactContext.startForegroundService(intent)
    }

    @ReactMethod
    fun stopService() {
        reactContext.stopService(intent)
    }
}