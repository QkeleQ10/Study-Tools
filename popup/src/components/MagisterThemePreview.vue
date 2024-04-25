<script setup>
import { computed, inject } from 'vue'

const syncedStorage = inject('syncedStorage')
const style = computed(() => {
    let accentColor = (syncedStorage.value['ptheme'] || 'auto,207,95,55')?.split(',')
    let pageColor = syncedStorage.value['pagecolor']?.startsWith('true')
        ? `hsl(${syncedStorage.value['pagecolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null
    let appbarColor = syncedStorage.value['appbarcolor']?.startsWith('true')
        ? `hsl(${syncedStorage.value['appbarcolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null
    let menubarColor = syncedStorage.value['sidecolor']?.startsWith('true')
        ? `hsl(${syncedStorage.value['sidecolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null
    accentColor?.shift()
    return {
        '--page': pageColor || `light-dark(#ffffff, #111111)`,
        '--appbar': appbarColor || `light-dark(${shiftedHslColor(207, 95, 47, ...accentColor)}, ${shiftedHslColor(207, 73, 22, ...accentColor)})`,
        '--menubar': menubarColor || `light-dark(${shiftedHslColor(207, 95, 55, ...accentColor)}, ${shiftedHslColor(207, 73, 30, ...accentColor)})`,
        '--sidebar': `light-dark(#ffffffaa, #0c0c0caa)`,
        '--foreground-accent': `light-dark(${shiftedHslColor(207, 78, 43, ...accentColor)}, ${shiftedHslColor(207, 53, 55, ...accentColor)})`,
        '--border': `light-dark(#dfdfdfaa, #2e2e2eaa)`,
        '--border-radius': (syncedStorage.value['shape'] ?? 8) + 'px',
        '--accent-1': `light-dark(${shiftedHslColor(207, 95, 55, ...accentColor)}, ${shiftedHslColor(207, 73, 30, ...accentColor)})`,
        '--accent-2': `light-dark(${shiftedHslColor(207, 95, 47, ...accentColor)}, ${shiftedHslColor(207, 73, 22, ...accentColor)})`,
    }
})

function shiftedHslColor(hueOriginal = 207, saturationOriginal = 95, luminanceOriginal = 55, hueWish = 0, saturationWish = 0, luminanceWish = 0, hueForce, saturationForce, luminanceForce) {
    let hue, saturation, luminance

    hueWish = Number(hueWish)
    saturationWish = Number(saturationWish)
    luminanceWish = Number(luminanceWish)

    if (hueForce) hue = hueForce
    else if (hueWish <= 207) hue = (hueOriginal / 207) * hueWish
    else if (hueWish > 207) {
        let a = (((360 - hueOriginal) / (360 - 207))),
            b = hueOriginal - a * 207
        hue = a * hueWish + b
    }

    if (saturationForce) saturation = saturationForce
    else if (saturationWish <= 95) saturation = (saturationOriginal / 95) * saturationWish
    else if (saturationWish > 95) {
        let a = (((100 - saturationOriginal) / (100 - 95))),
            b = saturationOriginal - a * 95
        saturation = a * saturationWish + b
    }

    if (luminanceForce) luminance = luminanceForce
    else if (luminanceWish <= 55) luminance = (luminanceOriginal / 55) * luminanceWish
    else if (luminanceWish > 55) {
        let a = (((100 - luminanceOriginal) / (100 - 55))),
            b = luminanceOriginal - a * 55
        luminance = a * luminanceWish + b
    }

    return `hsl(${hue}, ${saturation}%, ${luminance}%)`
}
</script>

<template>
    <div id="theme-preview" :style="style">
        <div id="appbar"></div>
        <div id="menubar">
            <div id="menubar-title"></div>
        </div>
        <div id="page">
            <div id="page-title"></div>
        </div>
        <div id="sidebar">
            <div class="widget" id="widget-grades"></div>
            <div class="widget"></div>
            <div class="widget"></div>
        </div>
    </div>
</template>

<style scoped>
* {
    transition: background 200ms, background-color 200ms, border 200ms;
}

#theme-preview {
    display: grid;
    grid-template-columns: 5% 22% 1fr 30%;
    grid-template-rows: 1fr;
    background-color: var(--page);
}

#appbar {
    background-color: var(--appbar);
}

#menubar,
#page,
#sidebar {
    padding-inline: 5px;
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 3%;
}

#menubar {
    background-color: var(--menubar);
}

#menubar-title {
    width: 25px;
    height: 5px;
    border-radius: 100vmax;
    background-color: #ffffff88;
}

#page {
    background-color: var(--page);
}

#page-title {
    width: 50%;
    height: 5px;
    border-radius: 100vmax;
    background-color: var(--foreground-accent);
}

#sidebar {
    padding-top: 5px;
    align-items: stretch;
    border-left: 1px solid var(--border);
    background-color: var(--sidebar);
}

.widget {
    height: 20px;
    border-radius: calc(var(--border-radius)*0.5);
    border: 1px solid var(--border);
}

#widget-grades {
    height: 25px;
    background: linear-gradient(35deg, var(--accent-1), var(--accent-2));
}
</style>