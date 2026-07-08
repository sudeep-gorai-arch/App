package com.flexiwalls.app

import android.app.WallpaperManager
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

class AndroidWallpaperModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val VIDEO_WALLPAPER_PREFS = "FlexiWallsVideoWallpaperPrefs"
    const val VIDEO_WALLPAPER_PREFS_HOME = "FlexiWallsVideoWallpaperPrefsHome"
    const val VIDEO_WALLPAPER_PREFS_LOCK = "FlexiWallsVideoWallpaperPrefsLock"
    const val VIDEO_WALLPAPER_PREFS_BOTH = "FlexiWallsVideoWallpaperPrefsBoth"

    const val VIDEO_WALLPAPER_PATH = "video_wallpaper_path"
    const val VIDEO_WALLPAPER_TARGET = "video_wallpaper_target"
    const val VIDEO_WALLPAPER_TITLE = "video_wallpaper_title"

    const val VIDEO_CROP_HAS_CONFIG = "video_crop_has_config"
    const val VIDEO_CROP_SCALE = "video_crop_scale"
    const val VIDEO_CROP_TRANSLATE_X = "video_crop_translate_x"
    const val VIDEO_CROP_TRANSLATE_Y = "video_crop_translate_y"
    const val VIDEO_CROP_PREVIEW_WIDTH = "video_crop_preview_width"
    const val VIDEO_CROP_PREVIEW_HEIGHT = "video_crop_preview_height"
    const val VIDEO_CROP_VIDEO_WIDTH = "video_crop_video_width"
    const val VIDEO_CROP_VIDEO_HEIGHT = "video_crop_video_height"

    const val VIDEO_CROP_X = "video_crop_x"
    const val VIDEO_CROP_Y = "video_crop_y"
    const val VIDEO_CROP_WIDTH = "video_crop_width"
    const val VIDEO_CROP_HEIGHT = "video_crop_height"

    private const val VIDEO_WALLPAPER_DIR = "video_wallpapers"
  }

  override fun getName(): String {
    return "AndroidWallpaperModule"
  }

  @ReactMethod
  fun applyWallpaper(
    imageUrl: String,
    target: String,
    cropRect: ReadableMap?,
    promise: Promise
  ) {
    Thread {
      var bitmapToApply: Bitmap? = null

      try {
        val cleanedUrl = imageUrl.trim()

        if (cleanedUrl.isEmpty()) {
          throw Exception("Wallpaper image URL is missing")
        }

        val imageBytes = readBytesFromSource(cleanedUrl, "Image")
        val decodedBitmap = decodeSafeBitmap(imageBytes)

        bitmapToApply = cropBitmapIfNeeded(decodedBitmap, cropRect)

        if (bitmapToApply !== decodedBitmap && !decodedBitmap.isRecycled) {
          decodedBitmap.recycle()
        }

        val wallpaperManager = WallpaperManager.getInstance(reactContext)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          val flags = when (target.lowercase()) {
            "home" -> WallpaperManager.FLAG_SYSTEM
            "lock" -> WallpaperManager.FLAG_LOCK
            "both" -> WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
            else -> WallpaperManager.FLAG_SYSTEM
          }

          wallpaperManager.setBitmap(bitmapToApply, null, true, flags)
        } else {
          wallpaperManager.setBitmap(bitmapToApply)
        }

        if (!bitmapToApply.isRecycled) {
          bitmapToApply.recycle()
        }

        promise.resolve(true)
      } catch (error: Exception) {
        try {
          if (bitmapToApply != null && !bitmapToApply.isRecycled) {
            bitmapToApply.recycle()
          }
        } catch (_: Exception) {
          // ignore recycle error
        }

        promise.reject(
          "APPLY_WALLPAPER_FAILED",
          error.message ?: "Could not apply wallpaper",
          error
        )
      }
    }.start()
  }

  @ReactMethod
  fun applyVideoWallpaper(
    videoUrl: String,
    target: String,
    title: String?,
    cropConfig: ReadableMap?,
    promise: Promise
  ) {
    Thread {
      try {
        val cleanedUrl = videoUrl.trim()

        if (cleanedUrl.isEmpty()) {
          throw Exception("Video wallpaper URL is missing")
        }

        val normalizedTarget = normalizeVideoTarget(target)
        val prefsName = getVideoPrefsName(normalizedTarget)

        val localVideoFile = copyVideoToPrivateStorage(
          value = cleanedUrl,
          target = normalizedTarget
        )

        saveVideoWallpaperConfig(
          prefsName = prefsName,
          videoPath = localVideoFile.absolutePath,
          target = normalizedTarget,
          title = title?.trim().takeUnless { it.isNullOrEmpty() }
            ?: "FlexiWalls Video Wallpaper",
          cropConfig = cropConfig
        )

        openAndroidLiveWallpaperPreview(
          target = normalizedTarget,
          promise = promise
        )
      } catch (error: Exception) {
        promise.reject(
          "APPLY_VIDEO_WALLPAPER_FAILED",
          error.message ?: "Could not open Android live wallpaper preview",
          error
        )
      }
    }.start()
  }

  private fun openAndroidLiveWallpaperPreview(
    target: String,
    promise: Promise
  ) {
    UiThreadUtil.runOnUiThread {
      try {
        val componentName = ComponentName(
          reactContext,
          getVideoWallpaperServiceClass(target)
        )

        val intent = Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER).apply {
          putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT, componentName)
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        reactContext.startActivity(intent)

        promise.resolve(true)
      } catch (error: ActivityNotFoundException) {
        try {
          val fallbackIntent = Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }

          reactContext.startActivity(fallbackIntent)

          promise.resolve(true)
        } catch (fallbackError: Exception) {
          promise.reject(
            "OPEN_LIVE_WALLPAPER_PREVIEW_FAILED",
            fallbackError.message ?: "Could not open Android live wallpaper preview",
            fallbackError
          )
        }
      } catch (error: Exception) {
        promise.reject(
          "OPEN_LIVE_WALLPAPER_PREVIEW_FAILED",
          error.message ?: "Could not open Android live wallpaper preview",
          error
        )
      }
    }
  }

  private fun getVideoWallpaperServiceClass(
    target: String
  ): Class<out VideoWallpaperService> {
    return when (normalizeVideoTarget(target)) {
      "home" -> HomeVideoWallpaperService::class.java
      "lock" -> LockVideoWallpaperService::class.java
      "both" -> BothVideoWallpaperService::class.java
      else -> LockVideoWallpaperService::class.java
    }
  }

  private fun getVideoPrefsName(target: String): String {
    return when (normalizeVideoTarget(target)) {
      "home" -> VIDEO_WALLPAPER_PREFS_HOME
      "lock" -> VIDEO_WALLPAPER_PREFS_LOCK
      "both" -> VIDEO_WALLPAPER_PREFS_BOTH
      else -> VIDEO_WALLPAPER_PREFS_LOCK
    }
  }

  private fun normalizeVideoTarget(target: String?): String {
  return when ((target ?: "").trim().lowercase()) {
    "home", "system" -> "home"
    "lock" -> "lock"
    "both", "all" -> "both"
    else -> "lock"
    }
  }

  private fun saveVideoWallpaperConfig(
    prefsName: String,
    videoPath: String,
    target: String,
    title: String,
    cropConfig: ReadableMap?
  ) {
    val prefs = reactContext.getSharedPreferences(
      prefsName,
      Context.MODE_PRIVATE
    )

    val editor = prefs.edit()
      .putString(VIDEO_WALLPAPER_PATH, videoPath)
      .putString(VIDEO_WALLPAPER_TARGET, normalizeVideoTarget(target))
      .putString(VIDEO_WALLPAPER_TITLE, title)

    saveVideoCropConfig(editor, cropConfig)

    editor.apply()
  }

  private fun saveVideoCropConfig(
    editor: android.content.SharedPreferences.Editor,
    cropConfig: ReadableMap?
  ) {
    if (cropConfig == null) {
      editor.putBoolean(VIDEO_CROP_HAS_CONFIG, false)
      return
    }

    val scale = readDouble(cropConfig, "scale", 1.0)
    val translateX = readDouble(cropConfig, "translateX", 0.0)
    val translateY = readDouble(cropConfig, "translateY", 0.0)

    val previewWidth = readDouble(cropConfig, "previewWidth", 0.0)
    val previewHeight = readDouble(cropConfig, "previewHeight", 0.0)

    val videoWidth = readDouble(cropConfig, "videoWidth", 0.0)
    val videoHeight = readDouble(cropConfig, "videoHeight", 0.0)

    val cropX = readDouble(cropConfig, "cropX", 0.0)
    val cropY = readDouble(cropConfig, "cropY", 0.0)
    val cropWidth = readDouble(cropConfig, "cropWidth", 0.0)
    val cropHeight = readDouble(cropConfig, "cropHeight", 0.0)

    if (
      !scale.isFinite() ||
      !translateX.isFinite() ||
      !translateY.isFinite() ||
      !previewWidth.isFinite() ||
      !previewHeight.isFinite() ||
      !videoWidth.isFinite() ||
      !videoHeight.isFinite() ||
      !cropX.isFinite() ||
      !cropY.isFinite() ||
      !cropWidth.isFinite() ||
      !cropHeight.isFinite() ||
      scale <= 0.0 ||
      previewWidth <= 0.0 ||
      previewHeight <= 0.0 ||
      videoWidth <= 0.0 ||
      videoHeight <= 0.0 ||
      cropWidth <= 0.0 ||
      cropHeight <= 0.0
    ) {
      editor.putBoolean(VIDEO_CROP_HAS_CONFIG, false)
      return
    }

    editor
      .putBoolean(VIDEO_CROP_HAS_CONFIG, true)
      .putFloat(VIDEO_CROP_SCALE, scale.toFloat())
      .putFloat(VIDEO_CROP_TRANSLATE_X, translateX.toFloat())
      .putFloat(VIDEO_CROP_TRANSLATE_Y, translateY.toFloat())
      .putFloat(VIDEO_CROP_PREVIEW_WIDTH, previewWidth.toFloat())
      .putFloat(VIDEO_CROP_PREVIEW_HEIGHT, previewHeight.toFloat())
      .putFloat(VIDEO_CROP_VIDEO_WIDTH, videoWidth.toFloat())
      .putFloat(VIDEO_CROP_VIDEO_HEIGHT, videoHeight.toFloat())
      .putFloat(VIDEO_CROP_X, cropX.toFloat())
      .putFloat(VIDEO_CROP_Y, cropY.toFloat())
      .putFloat(VIDEO_CROP_WIDTH, cropWidth.toFloat())
      .putFloat(VIDEO_CROP_HEIGHT, cropHeight.toFloat())
  }

  private fun copyVideoToPrivateStorage(
    value: String,
    target: String
  ): File {
    val extension = getVideoExtension(value)
    val normalizedTarget = normalizeVideoTarget(target)

    val directory = File(reactContext.filesDir, VIDEO_WALLPAPER_DIR)

    if (!directory.exists()) {
      directory.mkdirs()
    }

    cleanPreviousTargetVideos(directory, normalizedTarget, extension)

    val outputFile = File(
      directory,
      "current_video_wallpaper_$normalizedTarget.$extension"
    )

    openInputStream(value, "Video").use { input ->
      FileOutputStream(outputFile, false).use { output ->
        val buffer = ByteArray(256 * 1024)

        while (true) {
          val read = input.read(buffer)

          if (read <= 0) break

          output.write(buffer, 0, read)
        }

        output.flush()
      }
    }

    if (!outputFile.exists() || outputFile.length() <= 0L) {
      throw Exception("Downloaded video wallpaper is empty")
    }

    return outputFile
  }

  private fun cleanPreviousTargetVideos(
    directory: File,
    target: String,
    keepExtension: String
  ) {
    val possibleExtensions = listOf("mp4", "webm", "mov", "m4v")

    possibleExtensions.forEach { extension ->
      if (extension == keepExtension) return@forEach

      try {
        val oldFile = File(
          directory,
          "current_video_wallpaper_${normalizeVideoTarget(target)}.$extension"
        )

        if (oldFile.exists()) {
          oldFile.delete()
        }
      } catch (_: Exception) {
        // ignore cleanup error
      }
    }
  }

  private fun getVideoExtension(value: String): String {
    val cleanedValue = value.substringBefore("?").substringBefore("#").lowercase()

    return when {
      cleanedValue.endsWith(".webm") -> "webm"
      cleanedValue.endsWith(".mov") -> "mov"
      cleanedValue.endsWith(".m4v") -> "m4v"
      cleanedValue.endsWith(".mp4") -> "mp4"
      else -> "mp4"
    }
  }

  private fun readBytesFromSource(value: String, label: String): ByteArray {
    openInputStream(value, label).use { stream ->
      val output = ByteArrayOutputStream()
      val buffer = ByteArray(16 * 1024)

      while (true) {
        val read = stream.read(buffer)

        if (read <= 0) break

        output.write(buffer, 0, read)
      }

      return output.toByteArray()
    }
  }

  private fun openInputStream(value: String, label: String): InputStream {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      val connection = URL(value).openConnection() as HttpURLConnection

      connection.connectTimeout = 30000
      connection.readTimeout = 30000
      connection.instanceFollowRedirects = true
      connection.setRequestProperty("User-Agent", "FlexiWalls-Android")

      val responseCode = connection.responseCode

      if (responseCode < 200 || responseCode >= 300) {
        connection.disconnect()
        throw Exception("$label download failed with status $responseCode")
      }

      return connection.inputStream
    }

    if (value.startsWith("content://")) {
      val uri = Uri.parse(value)

      return reactContext.contentResolver.openInputStream(uri)
        ?: throw Exception("Could not open $label")
    }

    if (value.startsWith("file://")) {
      val uri = Uri.parse(value)
      val path = uri.path ?: throw Exception("Invalid $label file path")

      return FileInputStream(File(path))
    }

    return FileInputStream(File(value))
  }

  private fun decodeSafeBitmap(imageBytes: ByteArray): Bitmap {
    if (imageBytes.isEmpty()) {
      throw Exception("Wallpaper image is empty")
    }

    val boundsOptions = BitmapFactory.Options().apply {
      inJustDecodeBounds = true
    }

    BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size, boundsOptions)

    val sourceWidth = boundsOptions.outWidth
    val sourceHeight = boundsOptions.outHeight

    if (sourceWidth <= 0 || sourceHeight <= 0) {
      throw Exception("Could not read wallpaper size")
    }

    val decodeOptions = BitmapFactory.Options().apply {
      inPreferredConfig = Bitmap.Config.ARGB_8888
      inSampleSize = calculateInSampleSize(sourceWidth, sourceHeight)
    }

    return BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size, decodeOptions)
      ?: throw Exception("Could not decode wallpaper image")
  }

  private fun calculateInSampleSize(width: Int, height: Int): Int {
    val maxDimension = 4096
    var sampleSize = 1

    var nextWidth = width / 2
    var nextHeight = height / 2

    while (nextWidth >= maxDimension || nextHeight >= maxDimension) {
      sampleSize *= 2
      nextWidth /= 2
      nextHeight /= 2
    }

    return max(1, sampleSize)
  }

  private fun cropBitmapIfNeeded(
    sourceBitmap: Bitmap,
    cropRect: ReadableMap?
  ): Bitmap {
    if (cropRect == null) return sourceBitmap

    val rawX = readDouble(cropRect, "x", 0.0)
    val rawY = readDouble(cropRect, "y", 0.0)
    val rawWidth = readDouble(cropRect, "width", 0.0)
    val rawHeight = readDouble(cropRect, "height", 0.0)

    if (rawWidth <= 0.0 || rawHeight <= 0.0) {
      return sourceBitmap
    }

    val sourceWidth = sourceBitmap.width
    val sourceHeight = sourceBitmap.height

    if (sourceWidth <= 1 || sourceHeight <= 1) {
      return sourceBitmap
    }

    val x = clamp(rawX.roundToInt(), 0, sourceWidth - 1)
    val y = clamp(rawY.roundToInt(), 0, sourceHeight - 1)

    val width = clamp(rawWidth.roundToInt(), 1, sourceWidth - x)
    val height = clamp(rawHeight.roundToInt(), 1, sourceHeight - y)

    if (x == 0 && y == 0 && width == sourceWidth && height == sourceHeight) {
      return sourceBitmap
    }

    return Bitmap.createBitmap(sourceBitmap, x, y, width, height)
  }

  private fun readDouble(
    map: ReadableMap?,
    key: String,
    defaultValue: Double = 0.0
  ): Double {
    if (map == null || !map.hasKey(key) || map.isNull(key)) return defaultValue

    return try {
      map.getDouble(key)
    } catch (_: Exception) {
      defaultValue
    }
  }

  private fun clamp(value: Int, minValue: Int, maxValue: Int): Int {
    return min(max(value, minValue), maxValue)
  }
}