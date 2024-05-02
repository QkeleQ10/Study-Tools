<script setup>
import { inject } from 'vue'

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
        'wallpaper': 'custom,https://i.imgur.com/qY42IDh.png',
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
    },
    {
        name: "Wilde Westen",
        thumbnail: 'url(\'https://static.vecteezy.com/system/resources/previews/023/592/503/non_2x/american-desert-landscape-western-background-vector.jpg\')',
        'ptheme': 'dark,10,80,50',
        'pagecolor': 'false,0,0,7',
        'wallpaper': 'custom,https://i.imgur.com/UgMMNqN.png',
        'sidecolor': 'false,207,95,55',
        'decoration': 'custom,https://static.vecteezy.com/system/resources/previews/023/592/503/non_2x/american-desert-landscape-western-background-vector.jpg',
        'decoration-size': 1,
        'appbarcolor': 'false,207,95,47',
        'shape': 8
    }
]
</script>

<template>
    <div class="setting-wrapper">
        <div id="theme-presets-container">
            <div>
                <h3 class="setting-title">Themapakketten</h3>
                <span class="setting-subtitle">Als je een vooraf ingesteld themapakket selecteert, dan worden al je voorkeuren voor het uiterlijk gewist.</span>
            </div>
            <div id="theme-presets">
                <div v-for="preset in presets" :title="preset.name" :style="{ '--thumbnail': preset.thumbnail }"
                    @click="applyPreset(preset)">
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#theme-presets-container {
    position: relative;
    margin-inline: -8px;
    margin-top: 12px;
    margin-bottom: 16px;

    display: grid;
    /* grid-template-columns: 1fr 144px; */
    gap: 16px;

    padding: 16px;
    background-color: var(--color-surface-container-lowest);
    border-radius: 12px;
}

#theme-presets-container:before {
    content: '';
    position: absolute;
    left: 8px;
    right: 8px;
    top: -8px;
    border-top: 1px solid var(--color-surface-variant);
}

.setting-subtitle {
    text-wrap: balance;
}

#theme-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px;
}

#theme-presets>* {
    position: relative;
    width: 40px;
    height: 40px;
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