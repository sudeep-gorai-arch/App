package com.flexiwalls.app

import android.app.WallpaperManager
import android.graphics.BitmapFactory
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.net.URL

class AndroidWallpaperModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "AndroidWallpaperModule"
  }

  @ReactMethod
  fun applyWallpaper(imageUrl: String, target: String, promise: Promise) {
    Thread {
      try {
        val connection = URL(imageUrl).openConnection()
        connection.connectTimeout = 20000
        connection.readTimeout = 20000

        val bitmap = connection.getInputStream().use { inputStream ->
          BitmapFactory.decodeStream(inputStream)
        } ?: throw Exception("Could not decode wallpaper image")

        val wallpaperManager = WallpaperManager.getInstance(reactContext)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          val flags = when (target) {
            "home" -> WallpaperManager.FLAG_SYSTEM
            "lock" -> WallpaperManager.FLAG_LOCK
            "both" -> WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
            else -> WallpaperManager.FLAG_SYSTEM
          }

          wallpaperManager.setBitmap(bitmap, null, true, flags)
        } else {
          wallpaperManager.setBitmap(bitmap)
        }

        bitmap.recycle()

        promise.resolve(true)
      } catch (error: Exception) {
        promise.reject("APPLY_WALLPAPER_FAILED", error.message, error)
      }
    }.start()
  }
}