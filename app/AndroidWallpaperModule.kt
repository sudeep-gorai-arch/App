import android.app.WallpaperManager
import android.graphics.BitmapFactory
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class AndroidWallpaperModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AndroidWallpaperModule")

    AsyncFunction("applyWallpaper") { imageUrl: String, target: String ->
      val context = appContext.reactContext
        ?: throw Exception("React context is not available")

      val connection = URL(imageUrl).openConnection()
      connection.connectTimeout = 20000
      connection.readTimeout = 20000

      val bitmap = connection.getInputStream().use { inputStream ->
        BitmapFactory.decodeStream(inputStream)
      } ?: throw Exception("Could not decode wallpaper image")

      val wallpaperManager = WallpaperManager.getInstance(context)

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

      true
    }
  }
}