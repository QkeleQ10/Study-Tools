<script setup>
import { inject } from 'vue'
import MagisterThemePreview from './MagisterThemePreview.vue'

import themePresets from '../../public/themePresets.js'

const syncedStorage = inject('syncedStorage')

function applyPreset(preset) {
    for (const key in preset) {
        if (Object.hasOwnProperty.call(preset, key) && key != 'name' && key != 'thumbnail') {
            const value = preset[key]
            syncedStorage.value[key] = value
        }
    }
}
</script>

<template>
    <div class="setting-wrapper">
        <div id="theme-presets-container">
            <div id="theme-presets-heading">
                <h3 class="setting-title">Thema's</h3>
                <span class="setting-subtitle">Als je een thema selecteert, dan gaan al je aangepaste voorkeuren verloren.</span>
            </div>
            <div id="theme-presets">
                <button v-for="preset in themePresets" :title="preset.name" @click="applyPreset(preset)">
                    <MagisterThemePreview class="theme-preset-preview" :preset="preset" />
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
#theme-presets-container {
    display: grid;
    gap: 16px;
    padding-top: 16px;
}

#theme-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

#theme-presets>button {
    display: flex;
    flex-direction: column;
    padding: 0;
    margin: 0;
    width: 200px;
    padding: 10px;
    background-color: var(--color-surface-container);
    border: none;
    border-radius: 12px;
    cursor: pointer;
}

.theme-preset-preview {
    grid-area: preview;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    outline: 1px solid var(--color-outline-variant);
}
</style>