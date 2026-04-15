package com.teamrich.fishline2

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

class FloatingButtonService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var floatingView: View   // ☰ + 카운터 버튼이 통합된 단일 View
    private lateinit var miniPanel: View
    private var isMiniPanelAdded = false      // [BUG2 수정] addView 여부 별도 추적
    private var isPanelVisible = false
    private var items = mutableListOf<Pair<String, Int>>()
    private var selectedIndex = 0
    private lateinit var floatParams: WindowManager.LayoutParams
    private lateinit var panelParams: WindowManager.LayoutParams

    companion object {
        const val CHANNEL_ID = "fishline_floating"
        const val ACTION_UPDATE_ITEMS = "com.teamrich.fishline2.UPDATE_ITEMS"
        const val ACTION_SYNC_COUNT   = "com.teamrich.fishline2.SYNC_COUNT"
        const val ACTION_GET_ITEMS    = "com.teamrich.fishline2.GET_ITEMS"
        const val ACTION_RETURN_ITEMS = "com.teamrich.fishline2.RETURN_ITEMS"
        const val EXTRA_ITEMS    = "items"
        const val EXTRA_SELECTED = "selected"
        const val EXTRA_COUNT_ONLY = "countOnly"

        // static 보관 → getItems() 에서 접근
        var currentItemsJson: String = "[]"
        var currentSelectedIndex: Int = 0
    }

    // ─────────────────────────────────────────────
    // BroadcastReceiver: 앱 → 서비스 데이터 수신
    // ─────────────────────────────────────────────
    private val updateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
               ACTION_UPDATE_ITEMS -> {
    val json = intent.getStringExtra(EXTRA_ITEMS) ?: return
    val countOnly = intent.getBooleanExtra(EXTRA_COUNT_ONLY, false)
    val arr = JSONArray(json)
    items.clear()
    for (i in 0 until arr.length()) {
        val obj = arr.getJSONObject(i)
        items.add(Pair(obj.getString("name"), obj.getInt("count")))
    }
    // countOnly = true면 selectedIndex 건드리지 않음!
    if (!countOnly) {
        selectedIndex = intent.getIntExtra(EXTRA_SELECTED, 0)
    }
    saveCurrentState()
    updateMainButton()
    if (isPanelVisible) updateMiniPanel()
}
                ACTION_GET_ITEMS -> {
                    // 앱에서 풀링 방식으로 요청 시 응답
                    val returnIntent = Intent(ACTION_RETURN_ITEMS).apply {
                        putExtra(EXTRA_ITEMS, currentItemsJson)
                        putExtra(EXTRA_SELECTED, currentSelectedIndex)
                        setPackage(packageName)
                    }
                    sendBroadcast(returnIntent)
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FISHLINE")
            .setContentText("카운터 실행 중")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setSilent(true)
            .build()
        startForeground(1, notification)

        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        val filter = IntentFilter().apply {
            addAction(ACTION_UPDATE_ITEMS)
            addAction(ACTION_GET_ITEMS)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(updateReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(updateReceiver, filter)
        }

        setupFloatingButton() // floatingView 내부에 ☰ 버튼 포함
        setupMiniPanel()      // [BUG2 수정] addView는 하지 않음, 최초 show 시에만 추가

            // 서비스 시작되면 앱한테 "데이터 줘" 요청 👇 추가
    Handler(Looper.getMainLooper()).postDelayed({
        requestDataFromApp()
    }, 500) // 0.5초 후 요청 (JS 브리지 준비 대기)
    }

    override fun onDestroy() {
        super.onDestroy()
        try { unregisterReceiver(updateReceiver) } catch (e: Exception) {}
        if (::floatingView.isInitialized) {
            try { windowManager.removeView(floatingView) } catch (e: Exception) {}
        }
        if (isMiniPanelAdded && ::miniPanel.isInitialized) {
            try { windowManager.removeView(miniPanel) } catch (e: Exception) {}
        }
        stopForeground(STOP_FOREGROUND_REMOVE)
    }

    // ─────────────────────────────────────────────
    // View 셋업
    // ─────────────────────────────────────────────

    /**
     * [BUG3 수정] ☰ 버튼을 floatingView 레이아웃 안에 통합.
     * 이제 WindowManager에 등록된 View는 floatingView 하나뿐이므로
     * 이동 시 별도 업데이트 불필요.
     */

private fun requestDataFromApp() {
    try {
        val reactContext = (application as? ReactApplication)
            ?.reactNativeHost
            ?.reactInstanceManager
            ?.currentReactContext
        reactContext
            ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("FloatingServiceStarted", "")
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

    private fun setupFloatingButton() {
        floatingView = LayoutInflater.from(this)
            .inflate(R.layout.floating_button, null)

        floatParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM or Gravity.END  // 👈 TOP/START → BOTTOM/END 로 변경
    x = 16
    y = 80  // 👈 하단에서 80px 위 (네비게이션 높이 고려)
        }

        windowManager.addView(floatingView, floatParams)
        updateMainButton()

        // ☰ 버튼 클릭 리스너 — 레이아웃 내부 View이므로 여기서 처리
        val panelToggleBtn = floatingView.findViewById<View>(R.id.panel_toggle_btn)
        panelToggleBtn.setOnClickListener {
            if (isPanelVisible) hideMiniPanel() else showMiniPanel()
        }

        // 메인 카운터 버튼에만 터치(드래그+탭) 리스너 적용
        val mainCounterBtn = floatingView.findViewById<View>(R.id.main_counter_btn)
        setupTouchListener(mainCounterBtn)
    }

    /**
     * [BUG2 수정] miniPanel은 inflate만 해두고 addView는 하지 않음.
     * showMiniPanel() 최초 호출 시 addView 후 VISIBLE 처리.
     */
    private fun setupMiniPanel() {
        miniPanel = LayoutInflater.from(this)
            .inflate(R.layout.mini_panel, null)

        panelParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 0
            y = 0
        }
        // addView 여기서 하지 않음 → isMiniPanelAdded = false 유지
    }

    // ─────────────────────────────────────────────
    // 터치 리스너 (드래그 + 탭)
    // ─────────────────────────────────────────────
    private fun setupTouchListener(targetView: View) {
        val handler = Handler(Looper.getMainLooper())
        var isMoving = false
        var startX = 0f
        var startY = 0f
        var startParamX = 0
        var startParamY = 0
        var touchStartTime = 0L

        val moveRunnable = Runnable {
            isMoving = true
            floatingView.alpha = 0.6f
        }

        targetView.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    isMoving = false
                    touchStartTime = System.currentTimeMillis()
                    startX = event.rawX
                    startY = event.rawY
                    startParamX = floatParams.x
                    startParamY = floatParams.y
                    handler.postDelayed(moveRunnable, 500)
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - startX
                    val dy = event.rawY - startY
                    // 10px 이상 움직여야 드래그로 인식 (오탭 방지)
                    if (!isMoving && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
                        isMoving = true
                        handler.removeCallbacks(moveRunnable)
                        floatingView.alpha = 0.6f
                    }
                    if (isMoving) {
                        floatParams.x = startParamX + dx.toInt()
                        floatParams.y = startParamY + dy.toInt()
                        windowManager.updateViewLayout(floatingView, floatParams)
                        // 패널이 열려있으면 위치 동기화
                        if (isPanelVisible) {
                            syncPanelPosition()
                            windowManager.updateViewLayout(miniPanel, panelParams)
                        }
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    handler.removeCallbacks(moveRunnable)
                    val elapsed = System.currentTimeMillis() - touchStartTime
                    val dx = Math.abs(event.rawX - startX)
                    val dy = Math.abs(event.rawY - startY)

                    if (isMoving) {
                        isMoving = false
                        floatingView.alpha = 1.0f
                    } else if (dx < 15 && dy < 15 && elapsed < 500) {
                        // 탭 → 현재 선택 항목 +1
                        if (items.isNotEmpty()) {
                            val current = items[selectedIndex]
                            items[selectedIndex] = Pair(current.first, current.second + 1)
                            saveCurrentState()
                            updateMainButton()
                            if (isPanelVisible) updateMiniPanel()
                            emitSyncToJS()  // [BUG7 수정] JS로 실시간 전송
                        }
                    }
                    true
                }
                else -> false
            }
        }
    }

    // ─────────────────────────────────────────────
    // 패널 표시/숨김
    // ─────────────────────────────────────────────
    private fun showMiniPanel() {
        isPanelVisible = true
        syncPanelPosition()

        if (!isMiniPanelAdded) {
            // [BUG2 수정] 최초 열기 시에만 addView
            windowManager.addView(miniPanel, panelParams)
            isMiniPanelAdded = true
        } else {
            windowManager.updateViewLayout(miniPanel, panelParams)
        }

        updateMiniPanel()
        miniPanel.visibility = View.VISIBLE
    }

    private fun hideMiniPanel() {
        isPanelVisible = false
        miniPanel.visibility = View.GONE
        // [BUG1 수정] stopSelf() 호출 절대 없음 — 서비스는 계속 실행
    }

    /**
     * 패널 위치를 floatParams 기준으로 계산.
     * floatingView 전체 너비(☰36dp + 메인72dp = 약108dp ≈ 270px @ 2.75dpi)를 고려.
     */
 private fun syncPanelPosition() {
    val density = resources.displayMetrics.density
    val screenHeight = resources.displayMetrics.heightPixels

    // 패널을 플로팅 버튼 위쪽에 배치
    val panelHeightEstimate = (items.size * 52 * density).toInt() + (80 * density).toInt()
    var newY = floatParams.y - panelHeightEstimate

    // 화면 위로 나가면 버튼 아래쪽에 배치
    if (newY < 0) {
        val floatViewHeight = (72 * density).toInt()
        newY = floatParams.y + floatViewHeight + (8 * density).toInt()
    }

    // 화면 아래로 나가면 보정
    if (newY + panelHeightEstimate > screenHeight) {
        newY = screenHeight - panelHeightEstimate - (16 * density).toInt()
    }

    panelParams.x = floatParams.x
    panelParams.y = newY.coerceAtLeast(0)
}

    // ─────────────────────────────────────────────
    // UI 업데이트
    // ─────────────────────────────────────────────
    private fun updateMainButton() {
        if (!::floatingView.isInitialized) return
        val nameText  = floatingView.findViewById<TextView>(R.id.float_name)
        val countText = floatingView.findViewById<TextView>(R.id.float_count)
        if (items.isNotEmpty()) {
            val item = items[selectedIndex]
            nameText.text  = if (item.first.length > 4) item.first.substring(0, 4) else item.first
            countText.text = item.second.toString()
        } else {
            nameText.text  = "🎣"
            countText.text = "0"
        }
    }

 private fun updateMiniPanel() {
    if (!::miniPanel.isInitialized) return
    val container = miniPanel.findViewById<LinearLayout>(R.id.panel_items)
    container.removeAllViews()

    items.forEachIndexed { index, item ->
        val itemView = LayoutInflater.from(this)
            .inflate(R.layout.mini_panel_item, container, false)
        itemView.findViewById<TextView>(R.id.item_name).text  = item.first
        itemView.findViewById<TextView>(R.id.item_count).text = item.second.toString()
        itemView.setBackgroundColor(
            if (index == selectedIndex) Color.parseColor("#33C9A84C")
            else Color.TRANSPARENT
        )

        // 짧게 탭 → 이 index 항목 카운트 +1 (index를 직접 캡처)
        itemView.setOnClickListener {
            val current = items[index]  // selectedIndex 아닌 index 사용!
            items[index] = Pair(current.first, current.second + 1)
            saveCurrentState()
            updateMainButton()
            updateMiniPanel()
            emitSyncToJS()
        }

        // 길게 누르기 → 이 항목으로 selectedIndex 변경
        itemView.setOnLongClickListener {
            selectedIndex = index
            saveCurrentState()
            updateMainButton()
            updateMiniPanel()
            emitSyncToJS()
            true
        }

        container.addView(itemView)
    }

    val closeBtn = miniPanel.findViewById<TextView>(R.id.panel_close)
    closeBtn.setOnClickListener {
        hideMiniPanel()
    }
}

    // ─────────────────────────────────────────────
    // 데이터 저장 & JS 이벤트 전송
    // ─────────────────────────────────────────────
    private fun saveCurrentState() {
        val arr = JSONArray()
        items.forEachIndexed { _, item ->
            arr.put(JSONObject().apply {
                put("name",  item.first)
                put("count", item.second)
            })
        }
        currentItemsJson      = arr.toString()
        currentSelectedIndex  = selectedIndex
    }

    /**
     * [BUG7 수정] 플로팅 버튼에서 카운트 변경 시 JS(React Native)로 즉시 이벤트 전송.
     * counter.tsx의 DeviceEventEmitter.addListener('FloatingSyncCount', ...) 가 수신.
     */
    private fun emitSyncToJS() {
        try {
            val reactContext = (application as? ReactApplication)
                ?.reactNativeHost
                ?.reactInstanceManager
                ?.currentReactContext
            reactContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("FloatingSyncCount", currentItemsJson)
        } catch (e: Exception) {
            // ReactContext가 아직 준비 안 됐거나 앱이 백그라운드일 때 — 무시
            e.printStackTrace()
        }
    }

    // ─────────────────────────────────────────────
    // 알림 채널
    // ─────────────────────────────────────────────
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "FISHLINE 카운터",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                setSound(null, null)
                enableVibration(false)
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }
}
