<script setup>
import { ref, inject } from 'vue'
import settings from '/public/settings.js'
import { presets, propertyKeys } from '/public/themePresets.js'
import MagisterThemePreview from '@/components/MagisterThemePreview.vue'
import SwitchInput from '@/components/SwitchInput.vue'
import Slider from '@/components/setting-types/Slider.vue'
import ImageInput from '@/components/ImageInput.vue'
import ShortcutsEditor from '@/components/ShortcutsEditor.vue'
import Text from '@/components/setting-types/Text.vue'
import SingleChoice from '@/components/setting-types/SingleChoice.vue'
import ColorOverrideSetting from '@/components/setting-types/ColorOverrideSetting.vue'
import DecorationPickerSetting from '@/components/setting-types/DecorationPickerSetting.vue'
import LinkToOptionsTab from '@/components/setting-types/LinkToOptionsTab.vue'
import Dialog from '@/components/Dialog.vue'

const optionTypes = { SwitchInput, Slider, ImageInput, ShortcutsEditor, Text, SingleChoice, ColorOverrideSetting, DecorationPickerSetting, LinkToOptionsTab }

const syncedStorage = inject('syncedStorage')
const localStorage = inject('localStorage')

const importDialog = ref(false)
const selectedThemeId = ref(null)

let store = ref({
    version: "1.0",
    themes: []
})

import { onMounted } from 'vue'

onMounted(async () => {
    try {
        const response = await fetch('http://localhost:3000/themes')
        if (!response.ok) throw new Error('Network response was not ok')
        const themes = await response.json()
        store.value = {
            ...store.value,
            themes
        }
    } catch (e) {
        store.value = {
            ...store.value,
            themes: [{
                name: "Fout bij het laden",
                author: "ST",
                id: "error-theme",
            }]
        }
    }
})

const applyPreset = () => {
    if (!selectedThemeId.value) return
    const theme = store.value.themes.find(t => t.id === selectedThemeId.value)

    // Apply theme settings
    Object.entries(theme).forEach(([key, val]) => {
        if (propertyKeys.includes(key)) syncedStorage[key] = val
    })

    // Save to local storage
    localStorage.value.storedThemes = {
        ...localStorage.value.storedThemes,
        [theme.id]: theme
    }

    selectedThemeId.value = null
}
</script>

<template>
    <div class="options-category">
        <Dialog v-model:active="importDialog">
            <template #icon>format_paint</template>
            <template #headline>Thema importeren</template>
            <template #text>
                Weet je zeker dat je "{{store.themes.find(t => t.id === selectedThemeId)?.name}}" wilt importeren?
                Dit overschrijdt je huidige instellingen.
            </template>
            <template #buttons>
                <button class="primary" @click="applyPreset(); importDialog = false">Importeren</button>
                <button @click="importDialog = false">Annuleren</button>
            </template>
        </Dialog>

        <div id="personal-presets">
            <TransitionGroup name="list">
                <button v-for="preset in store.themes" class="theme-preset" :key="preset.id" :title="preset.name">
                    <MagisterThemePreview class="theme-preset-preview" :preset="preset" :scale="1.2" />
                    <div class="theme-preset-info">
                        <span class="theme-preset-name">{{ preset.name }}</span>
                        <span class="theme-preset-author">Door {{ preset.author }}</span>
                    </div>
                    <div class="theme-actions">
                        <a @click.stop="selectedThemeId = preset.id; importDialog = true;" title="Inladen">
                            <Icon>file_export</Icon>
                        </a>
                    </div>
                </button>
            </TransitionGroup>
            <p v-if="store.themes.length === 0" style="text-align: center;">
                De theme store is leeg! <br />
                Kom later terug
            </p>
        </div>
    </div>
</template>

<style scoped>
/* Behoud de bestaande styling */
.options-category {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 56px 1fr;
    height: 100%;
    overflow: hidden;
}

#personal-presets {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin: 8px;
}

.theme-preset {
    position: relative;
    display: flex;
    gap: 12px;
    padding: 8px;
    background-color: var(--color-surface-container);
    border: none;
    border-radius: 12px;
    cursor: pointer;
}

.theme-preset-preview {
    height: 60px;
    aspect-ratio: 16/9;
    border-radius: 8px;
    outline: 1px solid var(--color-outline-variant);
    overflow: hidden;
}

.theme-preset-info {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;
    text-align: start;
}

.theme-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
}
</style>