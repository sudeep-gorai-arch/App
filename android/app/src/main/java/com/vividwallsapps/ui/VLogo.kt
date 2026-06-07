package com.vividwallsapps.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

@Composable
fun VLogo(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(400.dp)
            .clip(RoundedCornerShape(80.dp))
            .background(Color(0xFF0A0214))
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height

            // Background subtle gradients
            drawRect(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFF1E0A3D), Color(0xFF0A0214)),
                    center = Offset(width * 0.5f, height * 0.5f),
                    radius = width * 0.8f
                )
            )

            // Wavy layers at the bottom
            drawWavyBackground(width, height)

            // The main "V" shape with neon glow
            drawVLogo(width, height)

            // Glass/Glossy effect
            drawGlassEffect(width, height)

            // Outer border glow
            drawRect(
                brush = Brush.linearGradient(
                    colors = listOf(
                        Color(0xFF00A3FF).copy(alpha = 0.4f),
                        Color(0xFFE000FF).copy(alpha = 0.4f)
                    ),
                    start = Offset(0f, 0f),
                    end = Offset(width, height)
                ),
                style = Stroke(width = 4.dp.toPx()),
                alpha = 0.6f
            )
        }
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawWavyBackground(width: Float, height: Float) {
    val waves = listOf(
        WaveConfig(0.65f, Color(0xFF003366), Color(0xFF1A0B2E), 0.3f),
        WaveConfig(0.75f, Color(0xFF004080), Color(0xFF2E0B4E), 0.4f),
        WaveConfig(0.85f, Color(0xFF0055AA), Color(0xFF4B0082), 0.5f),
        WaveConfig(0.95f, Color(0xFF00A3FF), Color(0xFF8A2BE2), 0.6f)
    )

    waves.forEachIndexed { index, wave ->
        val path = Path().apply {
            moveTo(0f, height * wave.startY)
            cubicTo(
                width * 0.25f, height * (wave.startY - 0.1f),
                width * 0.75f, height * (wave.startY + 0.1f),
                width, height * (wave.startY - 0.05f)
            )
            lineTo(width, height)
            lineTo(0f, height)
            close()
        }
        drawPath(
            path = path,
            brush = Brush.verticalGradient(
                colors = listOf(wave.color1.copy(alpha = wave.alpha), wave.color2.copy(alpha = wave.alpha))
            )
        )
        // Highlight line on top of the wave
        drawPath(
            path = Path().apply {
                moveTo(0f, height * wave.startY)
                cubicTo(
                    width * 0.25f, height * (wave.startY - 0.1f),
                    width * 0.75f, height * (wave.startY + 0.1f),
                    width, height * (wave.startY - 0.05f)
                )
            },
            color = wave.color1.copy(alpha = 0.5f),
            style = Stroke(width = 2.dp.toPx())
        )
    }
}

private data class WaveConfig(val startY: Float, val color1: Color, val color2: Color, val alpha: Float)

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawVLogo(width: Float, height: Float) {
    val vStrokeWidth = width * 0.18f
    val vTop = height * 0.25f
    val vBottom = height * 0.82f
    val vLeftX = width * 0.28f
    val vRightX = width * 0.72f
    val vCenterX = width * 0.5f

    // Glow effect (multiple layers of strokes with decreasing opacity)
    for (i in 1..10) {
        val glowAlpha = 0.1f / i
        val glowWidth = vStrokeWidth + (i * 4).dp.toPx()
        
        drawVLines(vLeftX, vTop, vCenterX, vBottom, vRightX, glowWidth, glowAlpha, width, height)
    }

    // Main V lines
    drawVLines(vLeftX, vTop, vCenterX, vBottom, vRightX, vStrokeWidth, 1f, width, height)
    
    // Inner bright line
    drawVLines(vLeftX, vTop, vCenterX, vBottom, vRightX, 2.dp.toPx(), 0.8f, width, height, Color.White)
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawVLines(
    leftX: Float, top: Float, centerX: Float, bottom: Float, rightX: Float,
    strokeWidth: Float, alpha: Float, width: Float, height: Float,
    overrideColor: Color? = null
) {
    // Left leg
    drawLine(
        brush = overrideColor?.let { Brush.linearGradient(listOf(it, it)) } ?: Brush.linearGradient(
            colors = listOf(Color(0xFF00A3FF).copy(alpha = alpha), Color(0xFF8A2BE2).copy(alpha = alpha)),
            start = Offset(leftX, top),
            end = Offset(centerX, bottom)
        ),
        start = Offset(leftX, top),
        end = Offset(centerX, bottom),
        strokeWidth = strokeWidth,
        cap = StrokeCap.Round
    )

    // Right leg
    drawLine(
        brush = overrideColor?.let { Brush.linearGradient(listOf(it, it)) } ?: Brush.linearGradient(
            colors = listOf(Color(0xFFE000FF).copy(alpha = alpha), Color(0xFF8A2BE2).copy(alpha = alpha)),
            start = Offset(rightX, top),
            end = Offset(centerX, bottom)
        ),
        start = Offset(rightX, top),
        end = Offset(centerX, bottom),
        strokeWidth = strokeWidth,
        cap = StrokeCap.Round
    )
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawGlassEffect(width: Float, height: Float) {
    // Diagonal light streak
    val path = Path().apply {
        moveTo(0f, 0f)
        lineTo(width * 0.8f, 0f)
        lineTo(0f, height * 0.8f)
        close()
    }
    drawPath(
        path = path,
        brush = Brush.linearGradient(
            colors = listOf(Color.White.copy(alpha = 0.15f), Color.Transparent),
            start = Offset(0f, 0f),
            end = Offset(width * 0.4f, height * 0.4f)
        )
    )

    // Top-left curved highlight
    drawArc(
        color = Color.White.copy(alpha = 0.2f),
        startAngle = 180f,
        sweepAngle = 90f,
        useCenter = false,
        topLeft = Offset(10.dp.toPx(), 10.dp.toPx()),
        size = androidx.compose.ui.geometry.Size(width * 0.4f, height * 0.4f),
        style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round)
    )
}

@Preview(showBackground = true)
@Composable
fun VLogoPreview() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .padding(20.dp)
    ) {
        VLogo(modifier = Modifier.size(300.dp))
    }
}
