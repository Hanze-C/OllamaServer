package io.kindbrave.ollamaserver.module;

import android.content.Intent;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import io.kindbrave.ollamaserver.service.OllamaService;

public class OllamaServiceModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private final Intent intent;

    public OllamaServiceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.intent = new Intent(reactContext, OllamaService.class);
    }

    @NonNull
    @Override
    public String getName() {
        return "OllamaServiceModule";
    }

    @ReactMethod
    public void startService() {
        reactContext.startForegroundService(intent);
    }

    @ReactMethod
    public void stopService() {
        reactContext.stopService(intent);
    }
}
