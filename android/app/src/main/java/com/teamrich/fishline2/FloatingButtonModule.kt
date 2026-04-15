package com.teamrich.fishline2

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableNativeMap

class FloatingButtonModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "FloatingButtonModule"
    }

    override fun getName(): String = NAME

    /**
     * 오버레이 권한 확인 후 FloatingButtonService 시작.
     * 권한이 없으면 설정 화면으로 이동하고 reject.
     */
    @ReactMethod
    fun startService(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(reactContext)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${reactContext.packageName}")
                    ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
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

    /**
     * 서비스의 현재 items + selectedIndex를 JS로 반환.
     * 서비스가 꺼져있거나 아직 데이터가 없으면 빈 배열 반환.
     */
    @ReactMethod
    fun getItems(promise: Promise) {
        try {
            val json        = FloatingButtonService.currentItemsJson
            val selectedIdx = FloatingButtonService.currentSelectedIndex
            val result      = WritableNativeMap()
            result.putString("items",    json)
            result.putInt("selected", selectedIdx)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    /**
     * JS → 서비스로 items 전체 갱신 브로드캐스트.
     * counter.tsx의 useEffect([items, curId]) 에서 호출.
     */
  @ReactMethod
fun updateItems(itemsJson: String, selectedIndex: Int, countOnlyUpdate: Boolean) {
    try {
        val intent = Intent(FloatingButtonService.ACTION_UPDATE_ITEMS).apply {
            putExtra(FloatingButtonService.EXTRA_ITEMS, itemsJson)
            putExtra(FloatingButtonService.EXTRA_SELECTED, selectedIndex)
            putExtra(FloatingButtonService.EXTRA_COUNT_ONLY, countOnlyUpdate) // 추가
            setPackage(reactContext.packageName)
        }
        reactContext.sendBroadcast(intent)
    } catch (e: Exception) {
        e.printStackTrace()
    }
}
}
