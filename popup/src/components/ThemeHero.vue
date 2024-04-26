<script setup>
import { inject } from 'vue'
import MagisterThemePreview from './MagisterThemePreview.vue'

const syncedStorage = inject('syncedStorage')

function applyPreset(preset) {
    for (const key in preset) {
        if (Object.hasOwnProperty.call(preset, key) && key != 'name' && key != 'thumbnail') {
            const value = preset[key]
            syncedStorage.value[key] = value
        }
    }
}

const presets = [
    {
        name: "Magister",
        thumbnail: 'url(\'https://upload.wikimedia.org/wikipedia/commons/4/49/Magister_6_logo.jpg\')',
        'ptheme': 'auto,207,95,55',
        'pagecolor': 'false,0,0,7',
        'wallpaper': 'none,',
        'sidecolor': 'false,207,95,55',
        'decoration': 'none,',
        'decoration-size': 1,
        'appbarcolor': 'false,207,95,47',
        'shape': 8
    },
    {
        name: "Hawaï",
        thumbnail: 'url(\'https://w0.peakpx.com/wallpaper/865/392/HD-wallpaper-hawaii-background-beautiful-colors-nature-outside-palm-trees-portrait-summer-water.jpg\')',
        'ptheme': 'light,180,50,40',
        'pagecolor': 'false,0,0,7',
        'wallpaper': 'custom,https://i.imgur.com/wWJAqG6.png',
        'sidecolor': 'false,207,95,55',
        'decoration': 'custom,https://w0.peakpx.com/wallpaper/865/392/HD-wallpaper-hawaii-background-beautiful-colors-nature-outside-palm-trees-portrait-summer-water.jpg',
        'decoration-size': 1,
        'appbarcolor': 'false,207,95,47',
        'shape': 8
    },
    {
        name: "Vaporwave",
        thumbnail: 'url(\'https://wallpapers.com/images/hd/80s-neon-veqvixadrbra13q4.jpg\')',
        'ptheme': 'dark,275,100,60',
        'pagecolor': 'false,0,0,7',
        'wallpaper': 'custom,https://i.imgur.com/ss4ty9u.png',
        'sidecolor': 'false,207,95,55',
        'decoration': 'custom,https://wallpapers.com/images/hd/80s-neon-veqvixadrbra13q4.jpg',
        'decoration-size': 1,
        'appbarcolor': 'false,207,95,47',
        'shape': 8
    }
]
</script>

<template>
    <div id="theme-hero">
        <MagisterThemePreview id="theme-preview" />
        <div id="theme-presets">
            <div v-for="preset in presets" :title="preset.name" :style="{ '--thumbnail': preset.thumbnail }" @click="applyPreset(preset)">
            </div>
        </div>
    </div>
</template>

<style scoped>
#theme-hero {
    position: sticky;
    top: 16px;
    width: 100%;
    margin-inline: 8px;

    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 16px;

    z-index: 6;
    padding: 16px;
    background-color: var(--color-surface-container);
    border-radius: 12px;
}

#theme-preview {
    width: 200px;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    outline: 1px solid var(--color-outline-variant);
}

#theme-presets {
    display: grid;
    grid-template-columns: repeat(3, 40px);
    align-content: start;
    gap: 6px;
}

#theme-presets>* {
    position: relative;
    min-width: 40px;
    aspect-ratio: 1;
    border: none;
    border-radius: 28px;
    cursor: pointer;
    outline: 1px solid var(--color-outline);
    overflow: hidden;
    color: #fff;
    transition: border-radius 200ms, flex-grow 200ms, background-color 200ms;
    background-image: var(--thumbnail);
    background-position: center;
    background-size: cover;
}
</style>