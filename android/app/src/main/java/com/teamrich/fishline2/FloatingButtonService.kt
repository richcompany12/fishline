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
import org.json.JSONArray
import org.json.JSONObject

class FloatingButtonService : Service() {
    private lateinit var windowManager: WindowManager
    private lateinit var floatingView: View
    private lateinit var miniPanel: View
    private lateinit var panelBtn: View
    private var isPanelVisible = false
    private var items = mutableListOf<Pair<String, Int>>()
    private var selectedIndex = 0
    private lateinit var floatParams: WindowManager.LayoutParams
    private lateinit var panelParams: WindowManager.LayoutParams
    private lateinit var panelBtnParams: WindowManager.LayoutParams

    companion object {
        const val CHANNEL_ID = "fishline_floating"
        const val ACTION_UPDATE_ITEMS = "com.teamrich.fishline2.UPDATE_ITEMS"
        const val ACTION_SYNC_COUNT = "com.teamrich.fishline2.SYNC_COUNT"
        const val ACTION_GET_ITEMS = "com.teamrich.fishline2.GET_ITEMS"
        const val ACTION_RETURN_ITEMS = "com.teamrich.fishline2.RETURN_ITEMS"
        const val EXTRA_ITEMS = "items"
        const val EXTRA_SELECTED = "selected"

        // 현재 데이터를 static 으로 보관 → getItems 에서 접근
        var currentItemsJson: String = "[]"
        var currentSelectedIndex: Int = 0
    }

    private val updateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                ACTION_UPDATE_ITEMS -> {
                    val json = intent.getStringExtra(EXTRA_ITEMS) ?: return
                    val arr = JSONArray(json)
                    items.clear()
                    for (i in 0 until arr.length()) {
                        val obj = arr.getJSONObject(i)
                        items.add(Pair(obj.getString("name"), obj.getInt("count")))
                    }
                    selectedIndex = intent.getIntExtra(EXTRA_SELECTED, 0)
                    updateMainButton()
                    if (isPanelVisible) updateMiniPanel()
                    saveCurrentState()
                }
                ACTION_GET_ITEMS -> {
                    // 앱에서 데이터 요청 → 현재 상태 브로드캐스트로 응답
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

        setupFloatingButton()
        setupPanelButton()
        setupMiniPanel()
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
            gravity = Gravity.TOP or Gravity.START
            x = 1000
            y = 1600
        }

        windowManager.addView(floatingView, floatParams)
        updateMainButton()

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

        floatingView.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    isMoving = false
                    touchStartTime = System.currentTimeMillis()
                    startX = event.rawX
                    startY = event.rawY
                    startParamX = floatParams.x
                    startParamY = floatParams.y
                    handler.postDelayed(moveRunnable, 600)
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    if (isMoving) {
                        floatParams.x = startParamX + (event.rawX - startX).toInt()
                        floatParams.y = startParamY + (event.rawY - startY).toInt()
                        windowManager.updateViewLayout(floatingView, floatParams)
                        // 패널 버튼도 같이 이동
                        panelBtnParams.x = floatParams.x - 50
                        panelBtnParams.y = floatParams.y
                        windowManager.updateViewLayout(panelBtn, panelBtnParams)
                        // 미니패널도 같이 이동
                        if (isPanelVisible) {
                            panelParams.x = floatParams.x - 220
                            panelParams.y = floatParams.y - 180
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
                    } else if (dx < 15 && dy < 15 && elapsed < 600) {
                        // 탭 → +1
                        if (items.isNotEmpty()) {
                            val current = items[selectedIndex]
                            items[selectedIndex] = Pair(current.first, current.second + 1)
                            updateMainButton()
                            broadcastCountChange()
                            saveCurrentState()
                        }
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun setupPanelButton() {
        // 📋 버튼 - 텍스트뷰로 간단하게
        val tv = TextView(this).apply {
            text = "☰"
            textSize = 16f
            setTextColor(Color.parseColor("#C9A84C"))
            setPadding(12, 12, 12, 12)
            setBackgroundColor(Color.parseColor("#CC141414"))
        }
        panelBtn = tv

        panelBtnParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 950
            y = 1600
        }

        windowManager.addView(panelBtn, panelBtnParams)

        panelBtn.setOnClickListener {
            if (isPanelVisible) hideMiniPanel() else showMiniPanel()
        }
    }

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
            x = 780
            y = 1420
        }

        windowManager.addView(miniPanel, panelParams)
        miniPanel.visibility = View.GONE
    }

    private fun updateMainButton() {
        if (!::floatingView.isInitialized) return
        val nameText = floatingView.findViewById<TextView>(R.id.float_name)
        val countText = floatingView.findViewById<TextView>(R.id.float_count)
        if (items.isNotEmpty()) {
            val item = items[selectedIndex]
            nameText.text = if (item.first.length > 4)
                item.first.substring(0, 4) else item.first
            countText.text = item.second.toString()
        } else {
            nameText.text = "🎣"
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
            val nameText = itemView.findViewById<TextView>(R.id.item_name)
            val countText = itemView.findViewById<TextView>(R.id.item_count)

            nameText.text = item.first
            countText.text = item.second.toString()
            itemView.setBackgroundColor(
                if (index == selectedIndex) Color.parseColor("#33C9A84C")
                else Color.TRANSPARENT
            )

            itemView.setOnClickListener {
                selectedIndex = index
                val current = items[selectedIndex]
                items[selectedIndex] = Pair(current.first, current.second + 1)
                updateMainButton()
                updateMiniPanel()
                broadcastCountChange()
                saveCurrentState()
            }
            container.addView(itemView)
        }

        val closeBtn = miniPanel.findViewById<TextView>(R.id.panel_close)
        closeBtn.setOnClickListener {
            hideMiniPanel()
            stopSelf()
        }
    }

    private fun showMiniPanel() {
        isPanelVisible = true
        panelParams.x = floatParams.x - 220
        panelParams.y = floatParams.y - 180
        windowManager.updateViewLayout(miniPanel, panelParams)
        updateMiniPanel()
        miniPanel.visibility = View.VISIBLE
    }

    private fun hideMiniPanel() {
        isPanelVisible = false
        miniPanel.visibility = View.GONE
    }

    private fun saveCurrentState() {
        val arr = JSONArray()
        items.forEachIndexed { index, item ->
            val obj = JSONObject()
            obj.put("name", item.first)
            obj.put("count", item.second)
            arr.put(obj)
        }
        currentItemsJson = arr.toString()
        currentSelectedIndex = selectedIndex
    }

    private fun broadcastCountChange() {
        val intent = Intent(ACTION_SYNC_COUNT).apply {
            putExtra(EXTRA_ITEMS, currentItemsJson)
            putExtra(EXTRA_SELECTED, selectedIndex)
            setPackage(packageName)
        }
        sendBroadcast(intent)
    }

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

    override fun onDestroy() {
        super.onDestroy()
        try { unregisterReceiver(updateReceiver) } catch (e: Exception) {}
        if (::floatingView.isInitialized) windowManager.removeView(floatingView)
        if (::miniPanel.isInitialized) windowManager.removeView(miniPanel)
        if (::panelBtn.isInitialized) windowManager.removeView(panelBtn)
        stopForeground(STOP_FOREGROUND_REMOVE)
    }
}