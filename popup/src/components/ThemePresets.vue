<script setup>
import { ref, inject } from 'vue'
import MagisterThemePreview from './MagisterThemePreview.vue'
import Dialog from './Dialog.vue'

import themePresets from '../../public/themePresets.js'

const syncedStorage = inject('syncedStorage')

const promptOpen = ref(false)
const promptingPreset = ref({})

function applyPreset() {
    const preset = promptingPreset.value
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
                <span class="setting-subtitle">Selecteer het tabblad 'Uiterlijk' om je thema aan te passen.</span>
            </div>
            <div id="theme-presets">
                <button v-for="preset in themePresets" class="theme-preset" :title="preset.name"
                    @click="promptOpen = true; promptingPreset = preset">
                    <MagisterThemePreview class="theme-preset-preview" :preset="preset" />
                    <div class="theme-preset-info">
                        <span class="theme-preset-name">{{ preset.name }}</span>
                        <span class="theme-preset-author">{{ preset.author }}</span>
                    </div>
                </button>
            </div>
        </div>
        <Dialog v-model:active="promptOpen">
            <template #icon>format_paint</template>
            <template #headline>Thema vervangen?</template>
            <template #text>
                Als je doorgaat, dan gaan je huidige thema en al je aangepaste themavoorkeuren verloren.
            </template>
            <template #buttons>
                <button @click="applyPreset(); promptOpen = false">Doorgaan</button>
                <button @click="promptOpen = false">Annuleren</button>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
#theme-presets-container {
    display: grid;
    gap: 16px;
    padding-top: 16px;
}

#theme-presets {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.theme-preset {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0;
    margin: 0;
    width: 196px;
    padding: 8px;
    background-color: var(--color-surface-container);
    border: none;
    border-radius: 12px;
    cursor: pointer;
}

.theme-preset-preview {
    grid-area: preview;
    width: 100%;
    height: 90px;
    border-radius: 8px;
    outline: 1px solid var(--color-outline-variant);
}

.theme-preset-info {
    display: flex;
    flex-direction: column;
    align-items: start;
}

.theme-preset-name {
    font: var(--typescale-body-medium);
    color: var(--color-on-surface-container);
}

.theme-preset-author {
    font: var(--typescale-body-small);
    color: var(--color-on-surface-variant);
}
</style>