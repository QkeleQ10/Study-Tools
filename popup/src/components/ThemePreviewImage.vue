<script setup>
import { ref, watch, onMounted } from 'vue'
import { usePreferredColorScheme } from '@vueuse/core'

const { style, scale } = defineProps({
    style: Object,
    scale: { type: Number, default: 1 }
})

const preferredColor = usePreferredColorScheme()

const wrapper = ref(null)
const canvas = ref(null)

// Draw the canvas on mount and whenever the style changes
onMounted(throttle(drawCanvas, 200))
watch(() => style, throttle(drawCanvas, 200))
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', throttle(drawCanvas, 200))
function throttle(func, wait) {
    let timeout = null
    let lastArgs = null
    let flag = false

    return function (...args) {
        if (!flag) {
            func.apply(this, args)
            flag = true
            timeout = setTimeout(() => {
                flag = false
                if (lastArgs) {
                    func.apply(this, lastArgs)
                    lastArgs = null
                }
            }, wait)
        } else {
            lastArgs = args
        }
    }
}

async function drawCanvas() {
    // Create a context and set the canvas size
    if (!canvas.value) return
    let ctx = canvas.value.getContext("2d")
    ctx.canvas.width = wrapper.value.clientWidth
    ctx.canvas.height = wrapper.value.clientHeight
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

    // Set up some constants for the drawing
    const
        canvasHeight = canvas.value.height,
        canvasWidth = canvas.value.width,
        textThickness = 0.03 * scale * canvasWidth,
        appbarWidth = 0.045 * scale * canvasWidth,
        menubarWidth = 0.195 * scale * canvasWidth,
        textMarginTop = 0.045 * scale * canvasWidth,
        textMarginLeft = 0.03 * scale * canvasWidth,
        sidebarWidth = 0.285 * scale * canvasWidth,
        widgetHeight = 0.105 * scale * canvasWidth,
        widgetGap = 0.015 * scale * canvasWidth,
        widgetMarginTop = 0.03 * scale * canvasWidth,
        widgetMarginLeft = 0.025 * scale * canvasWidth,
        widgetMarginRight = 0.03 * scale * canvasWidth,
        borderThickness = 0.004 * scale * canvasWidth

    // Page background
    ctx.fillStyle = style.pageColor ?? lightDark('#ffffff', '#111111')
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Page wallpaper
    if (style.wallpaperUrl) {
        const img = new Image()
        img.src = style.wallpaperUrl
        await new Promise(r => img.onload = r)
        const canvasRatio = canvasWidth / canvasHeight
        const imgRatio = img.width / img.height
        let drawWidth, drawHeight, offsetX, offsetY
        if (canvasRatio > imgRatio) {
            drawWidth = canvasWidth
            drawHeight = drawWidth / imgRatio
            offsetX = 0
            offsetY = (canvasHeight - drawHeight) / 2
        } else {
            drawHeight = canvasHeight
            drawWidth = drawHeight * imgRatio
            offsetX = (canvasWidth - drawWidth) / 2
            offsetY = 0
        }
        ctx.globalAlpha = style.wallpaperOpacity ?? 0.2
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
        ctx.globalAlpha = 1
    }

    // Appbar
    ctx.fillStyle = style.appbarColor ?? lightDark(shiftedHslColor(...style.accentColor, 95, 47), shiftedHslColor(...style.accentColor, 73, 22))
    ctx.fillRect(0, 0, appbarWidth, canvasHeight)

    // Menubar background
    ctx.fillStyle = style.menubarColor ?? lightDark(shiftedHslColor(...style.accentColor, 95, 55), shiftedHslColor(...style.accentColor, 73, 30))
    ctx.fillRect(appbarWidth, 0, menubarWidth, canvasHeight)

    // Menubar decoration
    if (style.decoration) {
        const img = new Image()
        img.src = style.decoration === 'custom' ? style.decorationUrl : await getDecoration(style.decoration)
        await new Promise(r => img.onload = r)
        const targetWidth = menubarWidth
        const targetX = appbarWidth
        const imgRatio = img.width / img.height
        const targetRatio = targetWidth / canvasHeight
        let drawWidth, drawHeight, offsetX, offsetY
        if (targetRatio > imgRatio) {
            drawWidth = targetWidth
            drawHeight = drawWidth / imgRatio
            offsetX = targetX
            offsetY = 0 - (drawHeight - canvasHeight) / 2
        } else {
            drawHeight = canvasHeight
            drawWidth = drawHeight * imgRatio
            offsetX = targetX - (drawWidth - targetWidth) / 2
            offsetY = 0
        }
        ctx.save()
        ctx.beginPath()
        ctx.rect(targetX, 0, targetWidth, canvasHeight)
        ctx.clip()
        if (style.decoration !== 'custom') ctx.globalCompositeOperation = 'lighter'
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
        ctx.globalCompositeOperation = 'source-over'
        ctx.restore()
    }

    // Menubar title
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.roundRect(appbarWidth + textMarginLeft, textMarginTop, menubarWidth * 0.65, textThickness, textThickness / 2);
    ctx.globalAlpha = 0.6
    ctx.fill()
    ctx.globalAlpha = 1

    // Page title
    ctx.fillStyle = lightDark(shiftedHslColor(...style.accentColor, 78, 43), shiftedHslColor(...style.accentColor, 53, 55));
    ctx.beginPath()
    ctx.roundRect(appbarWidth + menubarWidth + textMarginLeft, textMarginTop, menubarWidth, textThickness, textThickness / 2)
    ctx.fill()

    // Sidebar
    ctx.fillStyle = lightDark('#ffffffaa', '#0c0c0caa')
    ctx.fillRect(canvasWidth - sidebarWidth, 0, sidebarWidth, canvasHeight)
    ctx.strokeStyle = lightDark('#dfdfdfaa', '#2e2e2eaa')
    ctx.lineWidth = borderThickness
    ctx.beginPath()
    ctx.moveTo(canvasWidth - sidebarWidth, 0)
    ctx.lineTo(canvasWidth - sidebarWidth, canvasHeight)
    ctx.stroke()

    // Widgets
    ctx.beginPath()
    ctx.roundRect(
        canvasWidth - sidebarWidth + widgetMarginLeft,
        widgetMarginTop + (1.5 * widgetHeight) + widgetGap,
        sidebarWidth - widgetMarginLeft - widgetMarginRight,
        widgetHeight,
        style.shape / 2.5
    )
    ctx.roundRect(
        canvasWidth - sidebarWidth + widgetMarginLeft,
        widgetMarginTop + (2.5 * widgetHeight) + (2 * widgetGap),
        sidebarWidth - widgetMarginLeft - widgetMarginRight,
        widgetHeight,
        style.shape / 2.5
    )
    ctx.fill()
    ctx.stroke()

    // Grades widget
    const gradient = ctx.createLinearGradient(
        canvasWidth - sidebarWidth + widgetMarginLeft,
        widgetMarginTop,
        canvasWidth - sidebarWidth + widgetMarginLeft +
        sidebarWidth - widgetMarginLeft - widgetMarginRight,
        widgetMarginTop +
        widgetHeight * 1.5
    )
    gradient.addColorStop(0, lightDark(shiftedHslColor(...style.accentColor, 95, 55), shiftedHslColor(...style.accentColor, 73, 30)))
    gradient.addColorStop(1, lightDark(shiftedHslColor(...style.accentColor, 95, 47), shiftedHslColor(...style.accentColor, 73, 22)));
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(
        canvasWidth - sidebarWidth + widgetMarginLeft,
        widgetMarginTop,
        sidebarWidth - widgetMarginLeft - widgetMarginRight,
        widgetHeight * 1.5,
        style.shape / 2.5
    )
    ctx.fill()
    ctx.stroke()
}

async function getDecoration(decorationName) {
    return new Promise((resolve, reject) => {
        import(`@/assets/decorations/${decorationName}.png`)
            .then(module => resolve(module.default))
            .catch(reject)
    })
}

function lightDark(lightColor, darkColor) {
    switch (style.colorScheme) {
        case 'dark':
            return darkColor
        case 'light':
            return lightColor
        default:
            return preferredColor.value === 'dark' ? darkColor : lightColor
    }
}

function shiftedHslColor(wishH, wishS, wishL, defaultS, defaultL) {
    return `hsl(${wishH}, ${normaliseColorComponent(wishS, defaultS, 95)}%, ${normaliseColorComponent(wishL, defaultL, 55)}%)`
}

function normaliseColorComponent(x, a, b) {
    if (x <= b) {
        // First linear function: from 0 < x < b, correlate to 0 < y < a
        return (x / b) * a;
    } else {
        // Second linear function: from b < x < 100, correlate to a < y < 100
        return a + ((x - b) / (100 - b)) * (100 - a);
    }
}
</script>

<template>
    <div ref="wrapper">
        <canvas ref="canvas" width="300" height="150"></canvas>
    </div>
</template>

<style scoped>
.wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>