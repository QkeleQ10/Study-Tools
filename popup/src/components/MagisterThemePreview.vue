<script setup>
import { computed, inject, defineProps } from 'vue'

const props = defineProps(['preset'])

const syncedStorage = inject('syncedStorage')

const preset = props.preset || syncedStorage.value

const style = computed(() => {
    let accentColor = (preset['ptheme'] || 'auto,207,95,55')?.split(',')
    let pageColor = preset['pagecolor']?.startsWith('true')
        ? `hsl(${preset['pagecolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null
    let appbarColor = preset['appbarcolor']?.startsWith('true')
        ? `hsl(${preset['appbarcolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null
    let menubarColor = preset['sidecolor']?.startsWith('true')
        ? `hsl(${preset['sidecolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null
    let wallpaper = preset['wallpaper']?.startsWith('custom')
        ? `linear-gradient(color-mix(in srgb, var(--page), transparent ${Number(preset['wallpaper-opacity'] ?? 0.2) * 100}%), color-mix(in srgb, var(--page), transparent ${Number(preset['wallpaper-opacity'] ?? 0.2) * 100}%)), url(${preset['wallpaper'].replace('custom,', '')})`
        : 'none'
    let decoration = preset['decoration']?.startsWith('custom')
        ? `url(${preset['decoration'].replace('custom,', '')})`
        : 'none'
    accentColor?.shift()
    return {
        '--color-scheme': (preset['ptheme']?.split(',')?.[0] || 'auto').replace('auto', 'light dark'),
        '--page': pageColor || `light-dark(#ffffff, #111111)`,
        '--wallpaper': wallpaper,
        '--appbar': appbarColor || `light-dark(${shiftedHslColor(207, 95, 47, ...accentColor)}, ${shiftedHslColor(207, 73, 22, ...accentColor)})`,
        '--menubar': menubarColor || `light-dark(${shiftedHslColor(207, 95, 55, ...accentColor)}, ${shiftedHslColor(207, 73, 30, ...accentColor)})`,
        '--decoration': decoration,
        '--sidebar': `light-dark(#ffffffaa, #0c0c0caa)`,
        '--foreground-accent': `light-dark(${shiftedHslColor(207, 78, 43, ...accentColor)}, ${shiftedHslColor(207, 53, 55, ...accentColor)})`,
        '--border': `light-dark(#dfdfdfaa, #2e2e2eaa)`,
        '--border-radius': (preset['shape'] ?? 8) + 'px',
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

const decorations = [
    {
        id: 'none',
        style: {}
    },
    {
        id: 'waves',
        style: {
            'background-image': 'repeating-radial-gradient( circle at 0 0, transparent 0, var(--accent-1) 19px, transparent 20px ), repeating-linear-gradient( #ffffff11, #ffffff33 )'
        }
    },
    {
        id: 'zig-zag',
        style: {
            'background-image': 'linear-gradient(135deg, #ffffff11 25%, transparent 25%), linear-gradient(225deg, #ffffff11 25%, transparent 25%), linear-gradient(45deg, #ffffff11 25%, transparent 25%), linear-gradient(315deg, #ffffff11 25%, var(--accent-1) 25%)',
            'background-position': '15px 0, 15px 0, 0 0, 0 0',
            'background-size': '30px 30px',
            'background-repeat': 'repeat'
        }
    },
    {
        id: 'polka-dot',
        style: {
            'background-image': 'radial-gradient(#ffffff11 30%, transparent 31.2%), radial-gradient(#ffffff11 30%, transparent 31.2%)', 'background-position': '0px 0px, 15px 15px', 'background-size': '30px 30px'
        }
    },
    {
        id: 'stripes',
        style: {
            'background-image': 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff0a 10px, #ffffff22 20px)'
        }
    },
    {
        id: 'lego',
        style: {
            'background-size': '150px',
            'background-position': '14px 14px',
            'background-image': `url('https://raw.githubusercontent.com/QkeleQ10/http-resources/refs/heads/main/study-tools/themeassets/legopattern.svg')`
        }
    }
]
</script>

<template>
    <div id="theme-preview" :style="{ ...style, ...props.preset?.thumbnailStyle?.body }"
        :title="props.preset?.name ? 'Dit is een voorbeeld van je thema. Het kan zijn dat \nhet thema er net anders uitziet dan hier.' : 'Dit is een voorbeeld van je thema. Aangepaste CSS werkt niet in dit \nvoorbeeld, dus het kan zijn dat je thema er anders uitziet dan hier.'">
        <div id="appbar" :style="props.preset?.thumbnailStyle?.appbar"></div>
        <div id="menubar"
            :style="{ ...(decorations.find(e => preset['decoration']?.startsWith(e.id))?.style || {}), ...props.preset?.thumbnailStyle?.menubar }">
            <div id="menubar-title" :style="props.preset?.thumbnailStyle?.menubarTitle"></div>
        </div>
        <div id="page" :style="props.preset?.thumbnailStyle?.page">
            <div id="page-title" :style="props.preset?.thumbnailStyle?.pageTitle"></div>
        </div>
        <div id="sidebar" :style="props.preset?.thumbnailStyle?.sidebar">
            <div class="widget" id="widget-grades"
                :style="{ ...props.preset?.thumbnailStyle?.widgetGrades, ...props.preset?.thumbnailStyle?.widget }">
            </div>
            <div class="widget" :style="props.preset?.thumbnailStyle?.widget"></div>
            <div class="widget" :style="props.preset?.thumbnailStyle?.widget"></div>
        </div>
    </div>
</template>

<style scoped>
#theme-preview {
    color-scheme: var(--color-scheme);
    display: grid;
    grid-template-columns: 5% 22% 1fr 30%;
    grid-template-rows: 1fr;
    overflow: hidden;

    background-image: var(--wallpaper);
    background-position: center;
    background-size: cover;
    background-color: var(--page);
}

#theme-preview * {
    box-sizing: border-box;
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
    background-image: var(--decoration);
    background-position: center;
    background-size: cover;
    background-color: var(--menubar);
}

#menubar-title {
    width: 25px;
    height: 5px;
    border-radius: 100vmax;
    background-color: #ffffff88;
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
    border-radius: calc(var(--border-radius)*0.3);
    border: 1px solid var(--border);
    background-color: var(--sidebar);
}

#widget-grades {
    height: 25px;
    background: linear-gradient(35deg, var(--accent-1), var(--accent-2));
}
</style>