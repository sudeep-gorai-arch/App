package com.flexiwalls.app

import android.app.WallpaperManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

class AndroidWallpaperModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

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

        val imageBytes = readImageBytes(cleanedUrl)
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

  private fun readImageBytes(value: String): ByteArray {
    val inputStream = openImageInputStream(value)

    inputStream.use { stream ->
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

  private fun openImageInputStream(value: String): InputStream {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      val connection = URL(value).openConnection() as HttpURLConnection

      connection.connectTimeout = 25000
      connection.readTimeout = 25000
      connection.instanceFollowRedirects = true
      connection.setRequestProperty("User-Agent", "FlexiWalls-Android")

      val responseCode = connection.responseCode

      if (responseCode < 200 || responseCode >= 300) {
        connection.disconnect()
        throw Exception("Image download failed with status $responseCode")
      }

      return connection.inputStream
    }

    if (value.startsWith("content://")) {
      val uri = Uri.parse(value)

      return reactContext.contentResolver.openInputStream(uri)
        ?: throw Exception("Could not open wallpaper image")
    }

    if (value.startsWith("file://")) {
      val uri = Uri.parse(value)
      val path = uri.path ?: throw Exception("Invalid file path")

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

    val rawX = readDouble(cropRect, "x")
    val rawY = readDouble(cropRect, "y")
    val rawWidth = readDouble(cropRect, "width")
    val rawHeight = readDouble(cropRect, "height")

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

  private fun readDouble(map: ReadableMap, key: String): Double {
    if (!map.hasKey(key) || map.isNull(key)) return 0.0

    return try {
      map.getDouble(key)
    } catch (_: Exception) {
      0.0
    }
  }

  private fun clamp(value: Int, minValue: Int, maxValue: Int): Int {
    return min(max(value, minValue), maxValue)
  }
}