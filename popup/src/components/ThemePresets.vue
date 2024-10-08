<script setup>
import { ref, inject } from 'vue'
import themePresets from '../../public/themePresets.js'

const syncedStorage = inject('syncedStorage')

const promptOpen = ref(false)
const promptingPreset = ref({})

function applyPreset() {
    const preset = promptingPreset.value
    for (const key in preset) {
        if (Object.hasOwnProperty.call(preset, key) && key != 'name' && key != 'author' && key != 'thumbnailStyle') {
            const value = preset[key]
            syncedStorage.value[key] = value
        }
    }
}

function presetMatches(preset) {
    let matches = true
    for (const key in preset) {
        if (Object.hasOwnProperty.call(preset, key) && key != 'name' && key != 'author' && key != 'thumbnailStyle') {
            const value = preset[key]
            if (syncedStorage.value[key] !== value) matches = false
        }
    }
    return matches
}

function promptPreset(preset) {
    promptingPreset.value = preset
    if (themePresets.some(p => presetMatches(p))) applyPreset()
    else promptOpen.value = true
}
</script>

<template>
    <div id="theme-presets">
        <button v-for="preset in themePresets" class="theme-preset" :class="{ matches: presetMatches(preset) }"
            :title="preset.name" @click="promptPreset(preset)">
            <MagisterThemePreview class="theme-preset-preview" :preset="preset" />
            <div class="theme-preset-info">
                <span class="theme-preset-name">{{ preset.name }}</span>
                <span class="theme-preset-author">{{ preset.author }}</span>
            </div>
        </button>

        <Dialog v-model:active="promptOpen">
            <template #icon>format_paint</template>
            <template #headline>Aanpassingen wissen?</template>
            <template #text>
                Je hebt wijzigingen aangebracht aan je thema. Als je doorgaat, dan gaan je huidige thema en al je
                aangepaste themavoorkeuren verloren.
            </template>
            <template #buttons>
                <button @click="applyPreset(); promptOpen = false">Wissen</button>
                <button @click="promptOpen = false">Annuleren</button>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
#theme-presets {
    display: grid;
    grid-template-columns: 1fr 1fr;
    justify-items: stretch;
    gap: 8px;
    margin: 8px;
    margin-bottom: 16px;
}

.theme-preset {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0;
    margin: 0;
    padding: 8px;
    background-color: var(--color-surface-container);
    border: none;
    border-radius: 12px;
    cursor: pointer;
}

.theme-preset.matches {
    background-color: var(--color-primary-container);
    outline: 1px solid var(--color-outline);
}

.theme-preset-preview {
    grid-area: preview;
    width: 100%;
    height: 90px;
    border-radius: 8px;
    outline: 1px solid var(--color-outline-variant);
}

.theme-preset.matches .theme-preset-preview {
    outline: 1px solid var(--color-outline);
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