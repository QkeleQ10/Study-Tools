<script setup>
import { ref, computed, inject } from 'vue'
import Icon from './Icon.vue'
import Dialog from './Dialog.vue'
import InputText from './InputText.vue'

const syncedStorage = inject('syncedStorage')

const settingsInputDialogActive = ref(false)

function applyPreset(preset) {
    for (const key in preset) {
        if (Object.hasOwnProperty.call(preset, key) && key != 'name' && key != 'thumbnail') {
            const value = preset[key]
            syncedStorage.value[key] = value
        }
    }
}

const pick = (obj, ...keys) => Object.fromEntries(
    keys
        .filter(key => key in obj)
        .map(key => [key, obj[key]])
)

const themeString = computed({
    get() {
        try {
            return JSON.stringify(pick(syncedStorage.value, 'ptheme', 'pagecolor', 'wallpaper', 'sidecolor', 'decoration', 'decoration-size', 'appbarcolor', 'shape', 'custom-css')) || {}
        } catch {
            return {}
        }
    },
    set(value) {
        try {
            syncedStorage.value = { ...syncedStorage.value, ...(JSON.parse(value) || syncedStorage.value || {}) }
            return syncedStorage.value
        } catch {
            syncedStorage.value = syncedStorage.value || {}
            return syncedStorage.value
        }
    }
})

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
        'shape': 8,
        'custom-css': ''
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
        'shape': 8,
        'custom-css': ''
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
        'shape': 8,
        'custom-css': ''
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
        'shape': 8,
        'custom-css': ''
    }
]
</script>

<template>
    <div class="setting-wrapper">
        <div id="theme-presets-container">
            <div id="theme-presets-heading">
                <h3 class="setting-title">Themapakketten</h3>
                <span class="setting-subtitle">Als je een vooraf ingesteld themapakket selecteert, dan worden al je
                    voorkeuren voor het uiterlijk gewist.</span>
            </div>
            <button id="theme-presets-copy" title="Kopiëren/plakken" @click="settingsInputDialogActive = true">
                <Icon>copy_all</Icon>
            </button>
            <div id="theme-presets">
                <button v-for="preset in presets" :title="preset.name" :style="{ '--thumbnail': preset.thumbnail }"
                    @click="applyPreset(preset)">
                </button>
            </div>
        </div>
        <Dialog v-model:active="settingsInputDialogActive">
            <template #icon>copy_all</template>
            <template #headline>Thema kopiëren/plakken</template>
            <template #text>Kopieer de inhoud van het tekstvak om je thema op te slaan op je klembord. Plak in het
                tekstvak om het thema te wijzigen. Als je plakt, dan gaan al je huidige themavoorkeuren verloren.<br><br>
                <InputText id="settings-paste-input" v-model="themeString" @focus="$event.target.select()">
                    <template #title>Plak hier</template>
                </InputText>
            </template>
            <template #buttons>
                <button @click="settingsInputDialogActive = false">Sluiten</button>
            </template>
        </Dialog>
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

#theme-presets-heading {
    padding-right: 44px;
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
    color: var(--color-on-surface);
    transition: border-radius 200ms, flex-grow 200ms, background-color 200ms;
    background-image: var(--thumbnail);
    background-position: center;
    background-size: cover;
}

#theme-presets-copy {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 24px;
    height: 24px;
    margin-left: auto;
    border: none;
    background-color: transparent;
    color: var(--color-primary);
    cursor: pointer;
}

#theme-presets-copy>.icon {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    font-size: 18px;
}
</style>