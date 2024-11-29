<script setup>
import { ref, computed, inject, nextTick } from 'vue'
import { useStorage } from '@vueuse/core'
import settings from '/public/settings.js'
import { presets, propertyKeys } from '/public/themePresets.js'

import SwitchInput from '@/components/SwitchInput.vue'
import Slider from '@/components/setting-types/Slider.vue'
import ImageInput from '@/components/ImageInput.vue'
import ShortcutsEditor from '@/components/ShortcutsEditor.vue'
import Text from '@/components/setting-types/Text.vue'
import SingleChoice from '@/components/setting-types/SingleChoice.vue'
import ColorOverrideSetting from '@/components/setting-types/ColorOverrideSetting.vue'
import DecorationPickerSetting from '@/components/setting-types/DecorationPickerSetting.vue'
import LinkToOptionsTab from '@/components/setting-types/LinkToOptionsTab.vue'
const optionTypes = { SwitchInput, Slider, ImageInput, ShortcutsEditor, Text, SingleChoice, ColorOverrideSetting, DecorationPickerSetting, LinkToOptionsTab }

const syncedStorage = inject('syncedStorage')
const localStorage = inject('localStorage')
const shouldShowSetting = inject('shouldShowSetting')

const selectedTab = useStorage('selected-tab-theme', 0)

const promptOpen = ref(false)

const storedThemes = computed({
    get() {
        return Object.values(localStorage.value?.storedThemes || [])
    },
    set(value) {
        localStorage.value.storedThemes = value
    }
})

const allPresets = computed(() => [...storedThemes.value, ...presets])

function presetMatches(preset) {
    const fallbackPreset = presets[0]

    // Return true if every property matches the preset (or, if it doesn't exist, the fallback preset)
    return propertyKeys.every(key => syncedStorage.value[key] === (preset?.[key] ?? fallbackPreset[key]))
}

async function storeCurrentTheme() {
    if (storedThemes.value.length >= 9) return

    const fallbackPreset = presets[0]

    let obj = {}
    propertyKeys.forEach(key => {
        if (syncedStorage.value?.[key] !== fallbackPreset[key]) obj[key] = syncedStorage.value[key]
    })

    selectedTab.value = 0

    await nextTick()

    storedThemes.value = [
        ...storedThemes.value,
        {
            date: new Date().toISOString(),
            ...obj
        }
    ]
}
</script>

<template>
    <div class="options-category">
        <div class="tabs">
            <button class="tab" :class="{ active: selectedTab === 0 }" @click="selectedTab = 0">
                <span>Thema's</span>
            </button>
            <button class="tab" :class="{ active: selectedTab === 1 }" @click="selectedTab = 1">
                <span>Bewerken</span>
            </button>
        </div>

        <div class="tab-content" id="theme-pick" v-if="selectedTab === 0">
            <ThemePresets />
        </div>

        <div class="tab-content" id="theme-edit" v-else-if="selectedTab === 1">
            <ThemeColors v-model="syncedStorage.ptheme" />
            <div class="additional-options">
                <div class="surface-container">
                    <template v-for="setting in settings[0].settings.slice(1)">
                        <div class="setting-wrapper" :data-setting-id="setting.id"
                            v-if="!setting.hide && shouldShowSetting(setting)">
                            <component :is="optionTypes[setting.type || 'SwitchInput']" :setting="setting"
                                :id="setting.id" v-model="syncedStorage[setting.id]">
                                <template #title>{{ setting.title }}</template>
                                <template #subtitle>{{ setting.subtitle }}</template>
                            </component>
                            <Chip v-for="link in setting.links" :key="link.label" @click="openInNewTab(link.href)">
                                <template #icon>{{ link.icon }}</template>
                                <template #label>{{ link.label }}</template>
                            </Chip>
                        </div>
                    </template>
                </div>
                <div class="action-row" id="theme-edit-buttons">
                    <button v-if="allPresets.some(p => presetMatches(p))" disabled class="button tonal">
                        <Icon>library_add_check</Icon>
                        <span>Opgeslagen in thema's</span>
                    </button>
                    <button v-else-if="storedThemes.length >= 9" class="button tonal" @click="promptOpen = true">
                        <Icon>library_add</Icon>
                        <span>Opslaan in thema's</span>
                    </button>
                    <button v-else class="button tonal" @click="storeCurrentTheme">
                        <Icon>library_add</Icon>
                        <span>Opslaan in thema's</span>
                    </button>
                </div>
            </div>
        </div>

        <Dialog v-model:active="promptOpen">
            <template #headline>Opslaan mislukt</template>
            <template #text>
                Je kunt maximaal {{ storedThemes.length }} persoonlijke thema's hebben. Verwijder eerst
                een thema om een nieuwe op te slaan.
            </template>
            <template #buttons>
                <button @click="promptOpen = false">Sluiten</button>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.options-category {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 56px 1fr;
    height: 100%;
    overflow: hidden;
}

.tabs {
    align-self: end;

    display: flex;
    height: 48px;
    width: 100%;
    align-items: stretch;
    justify-content: stretch;
}

.tab {
    flex: 0px 1 1;
    height: 48px;
    box-sizing: border-box;
    border: none;
    border-bottom: 2px solid var(--color-surface-variant);
    background-color: var(--color-surface);
    color: var(--color-on-surface-variant);
    font: var(--typescale-title-small);
    cursor: pointer;
}

.tab.active {
    border-bottom-color: var(--color-primary);
    color: var(--color-on-surface);
}

.tab-content {
    max-height: 100%;
    overflow-y: auto;
}

#theme-edit {
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
}

#theme-edit>.additional-options {
    overflow-y: auto;
    margin-inline: 4px;
    border-radius: 12px;
}

#theme-edit>.additional-options>.surface-container {
    background-color: var(--color-surface-container);
    border-radius: 12px;
}

.additional-options .setting-wrapper:nth-child(n+2) {
    border-top: 1px solid var(--color-surface-variant);
}

.additional-options .setting-wrapper:last-child>button {
    border-bottom: none;
}

.setting-wrapper[data-setting-id="decoration"],
.setting-wrapper[data-setting-id="decoration-size"],
.setting-wrapper[data-setting-id="wallpaper"],
.setting-wrapper[data-setting-id="wallpaper-opacity"] {
    border-top: none !important;
    margin-top: -10px;
}

#theme-edit-buttons {
    margin: 16px;
    border: none;
}
</style>