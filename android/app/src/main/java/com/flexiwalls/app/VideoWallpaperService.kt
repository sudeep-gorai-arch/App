package com.flexiwalls.app

import android.content.Context
import android.graphics.SurfaceTexture
import android.media.MediaPlayer
import android.opengl.EGL14
import android.opengl.EGLConfig
import android.opengl.EGLContext
import android.opengl.EGLDisplay
import android.opengl.EGLSurface
import android.opengl.GLES11Ext
import android.opengl.GLES20
import android.service.wallpaper.WallpaperService
import android.util.Log
import android.view.Surface
import android.view.SurfaceHolder
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import kotlin.math.max
import kotlin.math.min

open class VideoWallpaperService : WallpaperService() {
  override fun onCreateEngine(): Engine {
    return VideoWallpaperEngine()
  }

  protected open fun getVideoPrefsName(): String {
    return AndroidWallpaperModule.VIDEO_WALLPAPER_PREFS
  }

  protected open fun getServiceLogName(): String {
    return "base"
  }

  private inner class VideoWallpaperEngine : Engine() {
    private var surfaceHolderRef: SurfaceHolder? = null
    private var surfaceReady = false
    private var surfaceWidth = 0
    private var surfaceHeight = 0
    private var visibleNow = false
    private var renderThread: VideoRenderThread? = null

    override fun onCreate(surfaceHolder: SurfaceHolder?) {
      super.onCreate(surfaceHolder)

      surfaceHolderRef = surfaceHolder
      setTouchEventsEnabled(false)
    }

    override fun onVisibilityChanged(visible: Boolean) {
      super.onVisibilityChanged(visible)

      visibleNow = visible

      if (visible) {
        startRendererIfPossible()
      } else {
        stopRenderer()
      }
    }

    override fun onSurfaceCreated(holder: SurfaceHolder) {
      super.onSurfaceCreated(holder)

      surfaceHolderRef = holder
      surfaceReady = true

      startRendererIfPossible()
    }

    override fun onSurfaceChanged(
      holder: SurfaceHolder,
      format: Int,
      width: Int,
      height: Int
    ) {
      super.onSurfaceChanged(holder, format, width, height)

      surfaceHolderRef = holder
      surfaceReady = true
      surfaceWidth = width
      surfaceHeight = height

      if (visibleNow) {
        restartRenderer()
      }
    }

    override fun onSurfaceDestroyed(holder: SurfaceHolder) {
      super.onSurfaceDestroyed(holder)

      surfaceReady = false
      surfaceHolderRef = null

      stopRenderer()
    }

    override fun onDestroy() {
      stopRenderer()
      super.onDestroy()
    }

    private fun startRendererIfPossible() {
      val holder = surfaceHolderRef ?: return
      val surface = holder.surface ?: return

      if (!visibleNow || !surfaceReady || !surface.isValid) {
        return
      }

      val config = readVideoWallpaperConfig()

      if (config.videoPath.isBlank()) {
        Log.e(TAG, "Video path is missing for ${getServiceLogName()}")
        return
      }

      val videoFile = File(config.videoPath)

      if (!videoFile.exists() || videoFile.length() <= 0L) {
        Log.e(TAG, "Video file does not exist for ${getServiceLogName()}: ${config.videoPath}")
        return
      }

      val displayMetrics = resources.displayMetrics

      val resolvedWidth = if (surfaceWidth > 0) {
        surfaceWidth
      } else {
        displayMetrics.widthPixels
      }

      val resolvedHeight = if (surfaceHeight > 0) {
        surfaceHeight
      } else {
        displayMetrics.heightPixels
      }

      if (resolvedWidth <= 0 || resolvedHeight <= 0) {
        Log.e(TAG, "Invalid wallpaper surface size for ${getServiceLogName()}")
        return
      }

      stopRenderer()

      renderThread = VideoRenderThread(
        outputSurface = surface,
        outputWidth = resolvedWidth,
        outputHeight = resolvedHeight,
        config = config,
        serviceName = getServiceLogName()
      ).also {
        it.start()
      }
    }

    private fun restartRenderer() {
      stopRenderer()
      startRendererIfPossible()
    }

    private fun stopRenderer() {
      val thread = renderThread ?: return

      renderThread = null
      thread.requestStop()

      if (Thread.currentThread() !== thread) {
        try {
          thread.join(800L)
        } catch (_: InterruptedException) {
          Thread.currentThread().interrupt()
        }
      }
    }
  }

  private data class VideoWallpaperConfig(
    val videoPath: String,
    val title: String,
    val target: String,
    val hasCropConfig: Boolean,
    val scale: Float,
    val translateX: Float,
    val translateY: Float,
    val previewWidth: Float,
    val previewHeight: Float,
    val videoWidth: Float,
    val videoHeight: Float,
    val cropX: Float,
    val cropY: Float,
    val cropWidth: Float,
    val cropHeight: Float
  )

  private class VideoRenderThread(
    private val outputSurface: Surface,
    private val outputWidth: Int,
    private val outputHeight: Int,
    private val config: VideoWallpaperConfig,
    private val serviceName: String
  ) : Thread("FlexiWallsVideoWallpaperRenderer-$serviceName") {
    @Volatile
    private var running = true

    @Volatile
    private var frameAvailable = false

    @Volatile
    private var textureCoordsNeedUpdate = true

    private val frameSyncObject = Object()

    private var eglDisplay: EGLDisplay = EGL14.EGL_NO_DISPLAY
    private var eglContext: EGLContext = EGL14.EGL_NO_CONTEXT
    private var eglSurface: EGLSurface = EGL14.EGL_NO_SURFACE
    private var eglConfig: EGLConfig? = null

    private var program = 0
    private var textureId = 0
    private var surfaceTexture: SurfaceTexture? = null
    private var videoSurface: Surface? = null
    private var mediaPlayer: MediaPlayer? = null

    private var aPositionHandle = -1
    private var aTexCoordHandle = -1
    private var uTexMatrixHandle = -1
    private var uTextureHandle = -1

    private val stMatrix = FloatArray(16)

    private val vertexBuffer: FloatBuffer = makeFloatBuffer(
      floatArrayOf(
        -1f, -1f,
        1f, -1f,
        -1f, 1f,
        1f, 1f
      )
    )

    private val texCoordBuffer: FloatBuffer = makeFloatBuffer(
      floatArrayOf(
        0f, 0f,
        1f, 0f,
        0f, 1f,
        1f, 1f
      )
    )

    private var preparedVideoWidth = config.videoWidth
    private var preparedVideoHeight = config.videoHeight

    override fun run() {
      try {
        initEgl()
        initGl()
        initVideoPlayer()

        GLES20.glViewport(0, 0, outputWidth, outputHeight)
        GLES20.glClearColor(0f, 0f, 0f, 1f)

        while (running) {
          var shouldDraw = false

          synchronized(frameSyncObject) {
            if (!frameAvailable && !textureCoordsNeedUpdate && running) {
              try {
                frameSyncObject.wait(50L)
              } catch (_: InterruptedException) {
                // ignore
              }
            }

            if (frameAvailable) {
              try {
                surfaceTexture?.updateTexImage()
                surfaceTexture?.getTransformMatrix(stMatrix)
                shouldDraw = true
              } catch (error: Exception) {
                Log.e(TAG, "SurfaceTexture update failed for $serviceName", error)
              }

              frameAvailable = false
            }
          }

          if (textureCoordsNeedUpdate) {
            updateTextureCoordinates()
            textureCoordsNeedUpdate = false
          }

          if (shouldDraw) {
            drawFrame()
            EGL14.eglSwapBuffers(eglDisplay, eglSurface)
          }
        }
      } catch (error: Exception) {
        Log.e(TAG, "Renderer failed for $serviceName", error)
      } finally {
        releaseAll()
      }
    }

    fun requestStop() {
      running = false

      synchronized(frameSyncObject) {
        frameSyncObject.notifyAll()
      }

      interrupt()
    }

    private fun initEgl() {
      eglDisplay = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY)

      if (eglDisplay == EGL14.EGL_NO_DISPLAY) {
        throw RuntimeException("Could not get EGL display")
      }

      val version = IntArray(2)

      if (!EGL14.eglInitialize(eglDisplay, version, 0, version, 1)) {
        throw RuntimeException("Could not initialize EGL")
      }

      val configAttribs = intArrayOf(
        EGL14.EGL_RENDERABLE_TYPE,
        EGL14.EGL_OPENGL_ES2_BIT,
        EGL14.EGL_RED_SIZE,
        8,
        EGL14.EGL_GREEN_SIZE,
        8,
        EGL14.EGL_BLUE_SIZE,
        8,
        EGL14.EGL_ALPHA_SIZE,
        8,
        EGL14.EGL_DEPTH_SIZE,
        0,
        EGL14.EGL_STENCIL_SIZE,
        0,
        EGL14.EGL_NONE
      )

      val configs = arrayOfNulls<EGLConfig>(1)
      val numConfigs = IntArray(1)

      if (
        !EGL14.eglChooseConfig(
          eglDisplay,
          configAttribs,
          0,
          configs,
          0,
          configs.size,
          numConfigs,
          0
        )
      ) {
        throw RuntimeException("Could not choose EGL config")
      }

      eglConfig = configs[0] ?: throw RuntimeException("EGL config is null")

      val contextAttribs = intArrayOf(
        EGL14.EGL_CONTEXT_CLIENT_VERSION,
        2,
        EGL14.EGL_NONE
      )

      eglContext = EGL14.eglCreateContext(
        eglDisplay,
        eglConfig,
        EGL14.EGL_NO_CONTEXT,
        contextAttribs,
        0
      )

      if (eglContext == EGL14.EGL_NO_CONTEXT) {
        throw RuntimeException("Could not create EGL context")
      }

      val surfaceAttribs = intArrayOf(EGL14.EGL_NONE)

      eglSurface = EGL14.eglCreateWindowSurface(
        eglDisplay,
        eglConfig,
        outputSurface,
        surfaceAttribs,
        0
      )

      if (eglSurface == EGL14.EGL_NO_SURFACE) {
        throw RuntimeException("Could not create EGL surface")
      }

      if (!EGL14.eglMakeCurrent(eglDisplay, eglSurface, eglSurface, eglContext)) {
        throw RuntimeException("Could not make EGL context current")
      }
    }

    private fun initGl() {
      program = createProgram(VERTEX_SHADER, FRAGMENT_SHADER)

      aPositionHandle = GLES20.glGetAttribLocation(program, "aPosition")
      aTexCoordHandle = GLES20.glGetAttribLocation(program, "aTexCoord")
      uTexMatrixHandle = GLES20.glGetUniformLocation(program, "uTexMatrix")
      uTextureHandle = GLES20.glGetUniformLocation(program, "sTexture")

      val textures = IntArray(1)
      GLES20.glGenTextures(1, textures, 0)
      textureId = textures[0]

      GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, textureId)
      GLES20.glTexParameteri(
        GLES11Ext.GL_TEXTURE_EXTERNAL_OES,
        GLES20.GL_TEXTURE_MIN_FILTER,
        GLES20.GL_LINEAR
      )
      GLES20.glTexParameteri(
        GLES11Ext.GL_TEXTURE_EXTERNAL_OES,
        GLES20.GL_TEXTURE_MAG_FILTER,
        GLES20.GL_LINEAR
      )
      GLES20.glTexParameteri(
        GLES11Ext.GL_TEXTURE_EXTERNAL_OES,
        GLES20.GL_TEXTURE_WRAP_S,
        GLES20.GL_CLAMP_TO_EDGE
      )
      GLES20.glTexParameteri(
        GLES11Ext.GL_TEXTURE_EXTERNAL_OES,
        GLES20.GL_TEXTURE_WRAP_T,
        GLES20.GL_CLAMP_TO_EDGE
      )

      surfaceTexture = SurfaceTexture(textureId).apply {
        setOnFrameAvailableListener {
          synchronized(frameSyncObject) {
            frameAvailable = true
            frameSyncObject.notifyAll()
          }
        }
      }

      videoSurface = Surface(surfaceTexture)
    }

    private fun initVideoPlayer() {
      val videoFile = File(config.videoPath)

      if (!videoFile.exists() || videoFile.length() <= 0L) {
        throw RuntimeException("Video file does not exist for $serviceName")
      }

      mediaPlayer = MediaPlayer().apply {
        setDataSource(videoFile.absolutePath)
        setSurface(videoSurface)
        isLooping = true
        setVolume(0f, 0f)

        setOnPreparedListener { player ->
          preparedVideoWidth = positiveOrFallback(
            player.videoWidth.toFloat(),
            config.videoWidth
          )

          preparedVideoHeight = positiveOrFallback(
            player.videoHeight.toFloat(),
            config.videoHeight
          )

          try {
            if (preparedVideoWidth > 0f && preparedVideoHeight > 0f) {
              surfaceTexture?.setDefaultBufferSize(
                preparedVideoWidth.toInt(),
                preparedVideoHeight.toInt()
              )
            }
          } catch (error: Exception) {
            Log.e(TAG, "Could not set default video buffer size for $serviceName", error)
          }

          textureCoordsNeedUpdate = true

          synchronized(frameSyncObject) {
            frameSyncObject.notifyAll()
          }

          try {
            player.seekTo(0)
          } catch (_: Exception) {
            // ignore
          }

          player.start()
        }

        setOnErrorListener { _, what, extra ->
          Log.e(TAG, "MediaPlayer error for $serviceName what=$what extra=$extra")
          true
        }

        prepareAsync()
      }
    }

    private fun drawFrame() {
      GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)

      GLES20.glUseProgram(program)

      GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
      GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, textureId)
      GLES20.glUniform1i(uTextureHandle, 0)

      GLES20.glUniformMatrix4fv(uTexMatrixHandle, 1, false, stMatrix, 0)

      vertexBuffer.position(0)
      GLES20.glEnableVertexAttribArray(aPositionHandle)
      GLES20.glVertexAttribPointer(
        aPositionHandle,
        2,
        GLES20.GL_FLOAT,
        false,
        0,
        vertexBuffer
      )

      texCoordBuffer.position(0)
      GLES20.glEnableVertexAttribArray(aTexCoordHandle)
      GLES20.glVertexAttribPointer(
        aTexCoordHandle,
        2,
        GLES20.GL_FLOAT,
        false,
        0,
        texCoordBuffer
      )

      GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)

      GLES20.glDisableVertexAttribArray(aPositionHandle)
      GLES20.glDisableVertexAttribArray(aTexCoordHandle)
    }

    private fun updateTextureCoordinates() {
      val actualVideoWidth = positiveOrFallback(preparedVideoWidth, config.videoWidth)
      val actualVideoHeight = positiveOrFallback(preparedVideoHeight, config.videoHeight)

      val cropRect = if (
        config.hasCropConfig &&
        config.cropWidth > 0f &&
        config.cropHeight > 0f &&
        actualVideoWidth > 0f &&
        actualVideoHeight > 0f
      ) {
        scaleSavedCropToActualVideo(
          savedCropX = config.cropX,
          savedCropY = config.cropY,
          savedCropWidth = config.cropWidth,
          savedCropHeight = config.cropHeight,
          savedVideoWidth = config.videoWidth,
          savedVideoHeight = config.videoHeight,
          actualVideoWidth = actualVideoWidth,
          actualVideoHeight = actualVideoHeight
        )
      } else {
        makeCenterCropRect(
          videoWidth = actualVideoWidth,
          videoHeight = actualVideoHeight,
          outputWidth = outputWidth.toFloat(),
          outputHeight = outputHeight.toFloat()
        )
      }

      val safeCrop = cropRect.copy(
        x = clamp(cropRect.x, 0f, actualVideoWidth - 1f),
        y = clamp(cropRect.y, 0f, actualVideoHeight - 1f),
        width = min(cropRect.width, actualVideoWidth - cropRect.x),
        height = min(cropRect.height, actualVideoHeight - cropRect.y)
      )

      val u0 = clamp(safeCrop.x / actualVideoWidth, 0f, 1f)
      val u1 = clamp((safeCrop.x + safeCrop.width) / actualVideoWidth, 0f, 1f)

      /*
       * React Native cropRect uses top-left origin:
       * y = 0 means top of the video.
       *
       * OpenGL texture coordinates need Y mapping handled here so the Android
       * preview matches the React Native crop preview.
       */
      val vTop = clamp(1f - (safeCrop.y / actualVideoHeight), 0f, 1f)
      val vBottom = clamp(
        1f - ((safeCrop.y + safeCrop.height) / actualVideoHeight),
        0f,
        1f
      )

      val coords = floatArrayOf(
        u0, vBottom,
        u1, vBottom,
        u0, vTop,
        u1, vTop
      )

      texCoordBuffer.clear()
      texCoordBuffer.put(coords)
      texCoordBuffer.position(0)

      Log.d(
        TAG,
        "Applied video crop service=$serviceName target=${config.target} actual=${actualVideoWidth}x$actualVideoHeight saved=${config.videoWidth}x${config.videoHeight} crop x=${safeCrop.x}, y=${safeCrop.y}, w=${safeCrop.width}, h=${safeCrop.height}, output=${outputWidth}x$outputHeight"
      )
    }

    private fun scaleSavedCropToActualVideo(
      savedCropX: Float,
      savedCropY: Float,
      savedCropWidth: Float,
      savedCropHeight: Float,
      savedVideoWidth: Float,
      savedVideoHeight: Float,
      actualVideoWidth: Float,
      actualVideoHeight: Float
    ): CropRect {
      val safeSavedVideoWidth = positiveOrFallback(savedVideoWidth, actualVideoWidth)
      val safeSavedVideoHeight = positiveOrFallback(savedVideoHeight, actualVideoHeight)

      val scaleX = actualVideoWidth / safeSavedVideoWidth
      val scaleY = actualVideoHeight / safeSavedVideoHeight

      val actualX = savedCropX * scaleX
      val actualY = savedCropY * scaleY
      val actualWidth = savedCropWidth * scaleX
      val actualHeight = savedCropHeight * scaleY

      return CropRect(
        x = clamp(actualX, 0f, actualVideoWidth - 1f),
        y = clamp(actualY, 0f, actualVideoHeight - 1f),
        width = clamp(actualWidth, 1f, actualVideoWidth),
        height = clamp(actualHeight, 1f, actualVideoHeight)
      )
    }

    private fun makeCenterCropRect(
      videoWidth: Float,
      videoHeight: Float,
      outputWidth: Float,
      outputHeight: Float
    ): CropRect {
      if (
        videoWidth <= 0f ||
        videoHeight <= 0f ||
        outputWidth <= 0f ||
        outputHeight <= 0f
      ) {
        return CropRect(0f, 0f, max(1f, videoWidth), max(1f, videoHeight))
      }

      val videoAspect = videoWidth / videoHeight
      val outputAspect = outputWidth / outputHeight

      return if (videoAspect > outputAspect) {
        val cropWidth = videoHeight * outputAspect
        val cropX = (videoWidth - cropWidth) / 2f

        CropRect(
          x = cropX,
          y = 0f,
          width = cropWidth,
          height = videoHeight
        )
      } else {
        val cropHeight = videoWidth / outputAspect
        val cropY = (videoHeight - cropHeight) / 2f

        CropRect(
          x = 0f,
          y = cropY,
          width = videoWidth,
          height = cropHeight
        )
      }
    }

    private fun releaseAll() {
      try {
        mediaPlayer?.setSurface(null)
      } catch (_: Exception) {
        // ignore
      }

      try {
        mediaPlayer?.release()
      } catch (_: Exception) {
        // ignore
      }

      mediaPlayer = null

      try {
        videoSurface?.release()
      } catch (_: Exception) {
        // ignore
      }

      videoSurface = null

      try {
        surfaceTexture?.release()
      } catch (_: Exception) {
        // ignore
      }

      surfaceTexture = null

      try {
        if (textureId != 0) {
          GLES20.glDeleteTextures(1, intArrayOf(textureId), 0)
        }
      } catch (_: Exception) {
        // ignore
      }

      textureId = 0

      try {
        if (program != 0) {
          GLES20.glDeleteProgram(program)
        }
      } catch (_: Exception) {
        // ignore
      }

      program = 0

      try {
        if (
          eglDisplay != EGL14.EGL_NO_DISPLAY &&
          eglContext != EGL14.EGL_NO_CONTEXT
        ) {
          EGL14.eglMakeCurrent(
            eglDisplay,
            EGL14.EGL_NO_SURFACE,
            EGL14.EGL_NO_SURFACE,
            EGL14.EGL_NO_CONTEXT
          )
        }
      } catch (_: Exception) {
        // ignore
      }

      try {
        if (
          eglDisplay != EGL14.EGL_NO_DISPLAY &&
          eglSurface != EGL14.EGL_NO_SURFACE
        ) {
          EGL14.eglDestroySurface(eglDisplay, eglSurface)
        }
      } catch (_: Exception) {
        // ignore
      }

      eglSurface = EGL14.EGL_NO_SURFACE

      try {
        if (
          eglDisplay != EGL14.EGL_NO_DISPLAY &&
          eglContext != EGL14.EGL_NO_CONTEXT
        ) {
          EGL14.eglDestroyContext(eglDisplay, eglContext)
        }
      } catch (_: Exception) {
        // ignore
      }

      eglContext = EGL14.EGL_NO_CONTEXT

      try {
        if (eglDisplay != EGL14.EGL_NO_DISPLAY) {
          EGL14.eglTerminate(eglDisplay)
        }
      } catch (_: Exception) {
        // ignore
      }

      eglDisplay = EGL14.EGL_NO_DISPLAY
    }

    private data class CropRect(
      val x: Float,
      val y: Float,
      val width: Float,
      val height: Float
    )

    companion object {
      private fun positiveOrFallback(value: Float, fallback: Float): Float {
        return when {
          value.isFinite() && value > 0f -> value
          fallback.isFinite() && fallback > 0f -> fallback
          else -> 1080f
        }
      }

      private fun clamp(value: Float, minValue: Float, maxValue: Float): Float {
        return min(max(value, minValue), maxValue)
      }

      private fun makeFloatBuffer(values: FloatArray): FloatBuffer {
        return ByteBuffer
          .allocateDirect(values.size * 4)
          .order(ByteOrder.nativeOrder())
          .asFloatBuffer()
          .apply {
            put(values)
            position(0)
          }
      }

      private fun createProgram(vertexSource: String, fragmentSource: String): Int {
        val vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, vertexSource)
        val fragmentShader = loadShader(GLES20.GL_FRAGMENT_SHADER, fragmentSource)

        val program = GLES20.glCreateProgram()

        if (program == 0) {
          throw RuntimeException("Could not create GL program")
        }

        GLES20.glAttachShader(program, vertexShader)
        GLES20.glAttachShader(program, fragmentShader)
        GLES20.glLinkProgram(program)

        val linkStatus = IntArray(1)
        GLES20.glGetProgramiv(program, GLES20.GL_LINK_STATUS, linkStatus, 0)

        if (linkStatus[0] != GLES20.GL_TRUE) {
          val error = GLES20.glGetProgramInfoLog(program)
          GLES20.glDeleteProgram(program)

          throw RuntimeException("Could not link GL program: $error")
        }

        GLES20.glDeleteShader(vertexShader)
        GLES20.glDeleteShader(fragmentShader)

        return program
      }

      private fun loadShader(type: Int, source: String): Int {
        val shader = GLES20.glCreateShader(type)

        if (shader == 0) {
          throw RuntimeException("Could not create shader")
        }

        GLES20.glShaderSource(shader, source)
        GLES20.glCompileShader(shader)

        val compileStatus = IntArray(1)
        GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, compileStatus, 0)

        if (compileStatus[0] != GLES20.GL_TRUE) {
          val error = GLES20.glGetShaderInfoLog(shader)
          GLES20.glDeleteShader(shader)

          throw RuntimeException("Could not compile shader: $error")
        }

        return shader
      }
    }
  }

  private fun readVideoWallpaperConfig(): VideoWallpaperConfig {
    val prefs = getSharedPreferences(
      getVideoPrefsName(),
      Context.MODE_PRIVATE
    )

    val videoPath = prefs.getString(
      AndroidWallpaperModule.VIDEO_WALLPAPER_PATH,
      ""
    ) ?: ""

    val title = prefs.getString(
      AndroidWallpaperModule.VIDEO_WALLPAPER_TITLE,
      "FlexiWalls Video Wallpaper"
    ) ?: "FlexiWalls Video Wallpaper"

    val target = prefs.getString(
      AndroidWallpaperModule.VIDEO_WALLPAPER_TARGET,
      "lock"
    ) ?: "lock"

    val hasCropConfig = prefs.getBoolean(
      AndroidWallpaperModule.VIDEO_CROP_HAS_CONFIG,
      false
    )

    return VideoWallpaperConfig(
      videoPath = videoPath,
      title = title,
      target = target,
      hasCropConfig = hasCropConfig,

      scale = prefs.getFloat(AndroidWallpaperModule.VIDEO_CROP_SCALE, 1f),
      translateX = prefs.getFloat(AndroidWallpaperModule.VIDEO_CROP_TRANSLATE_X, 0f),
      translateY = prefs.getFloat(AndroidWallpaperModule.VIDEO_CROP_TRANSLATE_Y, 0f),

      previewWidth = prefs.getFloat(AndroidWallpaperModule.VIDEO_CROP_PREVIEW_WIDTH, 0f),
      previewHeight = prefs.getFloat(AndroidWallpaperModule.VIDEO_CROP_PREVIEW_HEIGHT, 0f),

      videoWidth = prefs.getFloat(AndroidWallpaperModule.VIDEO_CROP_VIDEO_WIDTH, 1080f),
      videoHeight = prefs.getFloat(AndroidWallpaperModule.VIDEO_CROP_VIDEO_HEIGHT, 1920f),

      cropX = prefs.getFloat(AndroidWallpaperModule.VIDEO_CROP_X, 0f),
      cropY = prefs.getFloat(AndroidWallpaperModule.VIDEO_CROP_Y, 0f),
      cropWidth = prefs.getFloat(AndroidWallpaperModule.VIDEO_CROP_WIDTH, 0f),
      cropHeight = prefs.getFloat(AndroidWallpaperModule.VIDEO_CROP_HEIGHT, 0f)
    )
  }

  companion object {
    private const val TAG = "FlexiWallsVideoWallpaper"

    private const val VERTEX_SHADER = """
      attribute vec4 aPosition;
      attribute vec4 aTexCoord;

      uniform mat4 uTexMatrix;

      varying vec2 vTexCoord;

      void main() {
        gl_Position = aPosition;
        vTexCoord = (uTexMatrix * aTexCoord).xy;
      }
    """

    private const val FRAGMENT_SHADER = """
      #extension GL_OES_EGL_image_external : require

      precision mediump float;

      varying vec2 vTexCoord;

      uniform samplerExternalOES sTexture;

      void main() {
        gl_FragColor = texture2D(sTexture, vTexCoord);
      }
    """
  }
}

class HomeVideoWallpaperService : VideoWallpaperService() {
  override fun getVideoPrefsName(): String {
    return AndroidWallpaperModule.VIDEO_WALLPAPER_PREFS_HOME
  }

  override fun getServiceLogName(): String {
    return "home"
  }
}

class LockVideoWallpaperService : VideoWallpaperService() {
  override fun getVideoPrefsName(): String {
    return AndroidWallpaperModule.VIDEO_WALLPAPER_PREFS_LOCK
  }

  override fun getServiceLogName(): String {
    return "lock"
  }
}

class BothVideoWallpaperService : VideoWallpaperService() {
  override fun getVideoPrefsName(): String {
    return AndroidWallpaperModule.VIDEO_WALLPAPER_PREFS_BOTH
  }

  override fun getServiceLogName(): String {
    return "both"
  }
}