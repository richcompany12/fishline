package com.teamrich.fishline2

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class FloatingButtonModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "FloatingButtonModule"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun startService(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(reactContext)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${reactContext.packageName}")
                    ).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    reactContext.startActivity(intent)
                    promise.reject("NO_PERMISSION", "권한 설정 화면으로 이동했어요")
                    return
                }
            }

            val intent = Intent(reactContext, FloatingButtonService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            promise.resolve("success")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            val intent = Intent(reactContext, FloatingButtonService::class.java)
            reactContext.stopService(intent)
            promise.resolve("success")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

 @ReactMethod
fun getItems(promise: Promise) {
    try {
        val json = FloatingButtonService.currentItemsJson
        val selectedIdx = FloatingButtonService.currentSelectedIndex
        val result = com.facebook.react.bridge.WritableNativeMap()
        result.putString("items", json)
        result.putInt("selected", selectedIdx)
        promise.resolve(result)
    } catch (e: Exception) {
        promise.reject("ERROR", e.message)
    }
}   

    @ReactMethod
    fun updateItems(itemsJson: String, selectedIndex: Int) {
        try {
            val intent = Intent(FloatingButtonService.ACTION_UPDATE_ITEMS).apply {
                putExtra(FloatingButtonService.EXTRA_ITEMS, itemsJson)
                putExtra(FloatingButtonService.EXTRA_SELECTED, selectedIndex)
                setPackage(reactContext.packageName)
            }
            reactContext.sendBroadcast(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}