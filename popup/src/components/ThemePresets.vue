<script setup>
import { ref, inject } from 'vue'
import { presets, propertyKeys } from '../../public/themePresets.js'

const syncedStorage = inject('syncedStorage')

const promptOpen = ref(false)
const promptingPreset = ref({})

const allPresets = inject('allPresets')

function applyPreset() {
    const preset = promptingPreset.value
    const fallbackPreset = presets[0]

    propertyKeys.forEach(key => syncedStorage.value[key] = (preset?.[key] ?? fallbackPreset[key]))
}

function presetsMatch(preset1, preset2 = syncedStorage.value) {
    const fallbackPreset = presets[0]

    // Return true if every property matches the preset (or, if it doesn't exist, the fallback preset)
    return propertyKeys.every(key => (preset2?.[key] ?? fallbackPreset[key]) === (preset1?.[key] ?? fallbackPreset[key]))
}

function promptPreset(preset) {
    promptingPreset.value = preset
    if (allPresets.value.some(p => presetsMatch(p))) applyPreset()
    else promptOpen.value = true
}
</script>

<template>
    <div id="theme-presets">
        <div id="public-presets" class="theme-presets-grid">
            <button v-for="(preset, i) in presets" class="theme-preset" :class="{ matches: presetsMatch(preset) }"
                :title="preset.name" @click="promptPreset(preset)">
                <MagisterThemePreview class="theme-preset-preview" :preset="preset" />
                <div class="theme-preset-info">
                    <span class="theme-preset-name">{{ preset.name }}</span>
                    <span v-if="i >= 6" class="theme-preset-author">{{ preset.author }}</span>
                </div>
            </button>
        </div>

        <Dialog v-model:active="promptOpen">
            <template #icon>format_paint</template>
            <template #headline>Let op!</template>
            <template #text>
                Je hebt wijzigingen aangebracht aan je thema. Als je dit thema nu toepast, dan gaan je huidige thema en
                al je aangepaste themavoorkeuren verloren.
            </template>
            <template #buttons>
                <button @click="applyPreset(); promptOpen = false">Toepassen</button>
                <button @click="promptOpen = false">Annuleren</button>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.theme-presets-grid {
    position: relative;
    display: grid;
    grid-template-columns: 50% 50%;
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

    .theme-preset-preview {
        grid-area: preview;
        width: 100%;
        height: 90px;
        border-radius: 8px;
        outline: 1px solid var(--color-outline-variant);
        overflow: hidden;
    }

    .theme-preset-info {
        display: flex;
        flex-direction: column;
        align-items: start;
        text-align: start;
    }

    .theme-preset-name {
        font: var(--typescale-body-medium);
        color: var(--color-on-surface-container);
    }

    .theme-preset-author,
    .theme-preset-date {
        font: var(--typescale-body-small);
        color: var(--color-on-surface-variant);
    }

    &.matches {
        background-color: var(--color-primary-container);
        outline: 1px solid var(--color-outline);

        .theme-preset-preview {
            outline: 1px solid var(--color-outline);
        }
    }
}
</style>