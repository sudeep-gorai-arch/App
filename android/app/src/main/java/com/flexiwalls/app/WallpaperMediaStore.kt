package com.flexiwalls.app

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.webkit.MimeTypeMap
import java.io.File
import java.io.FileNotFoundException

/**
 * Only saves app-created downloads and accesses individual recorded MediaStore URIs.
 * Android 10+ does not require library read permissions for media owned by this app.
 */
internal class WallpaperMediaStore(private val context: Context) {
  private fun requireScopedStorage() {
    check(Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) { "Scoped storage requires Android 10" }
  }

  private fun mediaUri(value: String): Uri {
    val uri = Uri.parse(value)
    require(uri.scheme == "content" && uri.authority == "media") { "Invalid media URI" }
    val parts = uri.pathSegments
    val valid = (parts.size == 4 && parts[1] in listOf("images", "video") && parts[2] == "media") ||
      (parts.size == 3 && parts[1] == "file")
    require(valid && parts.last().toLongOrNull() != null) { "Invalid media item URI" }
    return uri
  }

  fun save(sourceUri: String, isVideo: Boolean): String {
    requireScopedStorage()
    val source = Uri.parse(sourceUri)
    require(source.scheme == "file") { "Download must be a local cache file" }
    val file = File(requireNotNull(source.path)).canonicalFile
    val roots = listOfNotNull(context.cacheDir, context.externalCacheDir).map { it.canonicalFile }
    require(roots.any { file.path.startsWith(it.path + File.separator) }) { "Download must be in app cache" }
    require(file.isFile && file.length() > 0 && file.name.startsWith("flexiwalls-")) { "Invalid download file" }
    val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(file.extension.lowercase())
      ?: throw IllegalArgumentException("Unsupported wallpaper format")
    require(mime.startsWith(if (isVideo) "video/" else "image/")) { "Wallpaper media type mismatch" }

    val resolver = context.contentResolver
    val collection = if (isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      else MediaStore.Images.Media.EXTERNAL_CONTENT_URI
    val folder = if (isVideo) Environment.DIRECTORY_MOVIES else Environment.DIRECTORY_PICTURES
    val values = ContentValues().apply {
      put(MediaStore.MediaColumns.DISPLAY_NAME, file.name)
      put(MediaStore.MediaColumns.MIME_TYPE, mime)
      put(MediaStore.MediaColumns.RELATIVE_PATH, "$folder/FlexiWalls/")
      put(MediaStore.MediaColumns.IS_PENDING, 1)
    }
    val inserted = resolver.insert(collection, values)
      ?: throw IllegalStateException("Could not create wallpaper")
    try {
      val output = resolver.openOutputStream(inserted, "w")
        ?: throw IllegalStateException("Could not open wallpaper for saving")
      output.use { destination -> file.inputStream().use { it.copyTo(destination) } }
      val published = resolver.update(inserted, ContentValues().apply {
        put(MediaStore.MediaColumns.IS_PENDING, 0)
      }, null, null)
      check(published == 1) { "Could not publish wallpaper" }
      return inserted.toString()
    } catch (error: Exception) {
      try { resolver.delete(inserted, null, null) } catch (_: Exception) { }
      throw error
    }
  }

  fun exists(value: String): Boolean {
    requireScopedStorage()
    val uri = mediaUri(value)
    // Permission/provider errors propagate. The JS layer retains uncertain records.
    val cursor = context.contentResolver.query(uri, arrayOf(MediaStore.MediaColumns._ID), null, null, null)
      ?: throw IllegalStateException("Media provider unavailable")
    cursor.use { if (!it.moveToFirst()) return false }
    return try {
      context.contentResolver.openFileDescriptor(uri, "r")?.use { true }
        ?: throw IllegalStateException("Media provider unavailable")
    } catch (_: FileNotFoundException) {
      false
    }
  }

  fun delete(value: String): Boolean {
    requireScopedStorage()
    val uri = mediaUri(value)
    val resolver = context.contentResolver
    // Never delete arbitrary library items, including media from a previous install
    // that Android no longer attributes to this app.
    val cursor = resolver.query(uri, arrayOf(
      MediaStore.MediaColumns.OWNER_PACKAGE_NAME,
      MediaStore.MediaColumns.DISPLAY_NAME
    ), null, null, null) ?: throw IllegalStateException("Media provider unavailable")
    cursor.use {
      if (!it.moveToFirst()) return true
      check(it.getString(0) == context.packageName && it.getString(1)?.startsWith("flexiwalls-") == true) {
        "Wallpaper is not owned by this app"
      }
    }
    return resolver.delete(uri, null, null) > 0 || !exists(value)
  }
}
