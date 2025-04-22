<script setup>
import { ref, computed, inject, provide } from 'vue'
import { useDropZone, useFileDialog, useStorage } from '@vueuse/core'
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

const isApplyPromptActive = ref(false)
const applyPromptPreset = ref({})

const isDeletePromptActive = ref(false)
const deletePromptIndex = ref(0)

const storedThemes = computed({
    get() { return Object.values(localStorage.value?.storedThemes || []) },
    set(value) { localStorage.value.storedThemes = value }
})

const allPresets = computed(() => [...storedThemes.value, ...presets])

provide('allPresets', allPresets)

const fileDialog = useFileDialog({
    multiple: false, accept: '.sttheme', reset: true,
})
fileDialog.onChange(presetUploaded)

useDropZone(document, {
    onDrop: presetUploaded, multiple: false
})

async function presetUploaded(files) {
    if (!files) return
    const file = files[0]

    if (!file || !file.name.endsWith('.sttheme')) return
    const json = JSON.parse(await file.text())
    const fallbackPreset = presets[0]

    let obj = {};
    ([...propertyKeys, 'name', 'author', 'date']).forEach(key => {
        if (json?.[key] !== fallbackPreset[key]) obj[key] = json[key]
    })

    if (allPresets.value.some(p => presetsMatch(p, obj))) return

    storedThemes.value = [
        ...storedThemes.value,
        {
            date: new Date().toISOString(),
            ...obj
        }
    ]
}

function presetsMatch(preset1, preset2 = syncedStorage.value) {
    const fallbackPreset = presets[0]

    // Return true if every property matches the preset (or, if it doesn't exist, the fallback preset)
    return propertyKeys.every(key => (preset2?.[key] ?? fallbackPreset[key]) === (preset1?.[key] ?? fallbackPreset[key]))
}

function promptPreset(preset) {
    applyPromptPreset.value = preset
    if (allPresets.value.some(p => presetsMatch(p))) applyPreset()
    else isApplyPromptActive.value = true
}

function applyPreset() {
    const preset = applyPromptPreset.value
    const fallbackPreset = presets[0]

    propertyKeys.forEach(key => syncedStorage.value[key] = (preset?.[key] ?? fallbackPreset[key]))
}

function generatePresetUrl(preset) {
    const fallbackPreset = presets[0]

    let obj = {};
    ([...propertyKeys, 'name', 'author', 'date']).forEach(key => {
        if (preset?.[key] !== fallbackPreset[key]) obj[key] = preset[key]
    })

    return "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj))
}

async function storeCurrentTheme() {
    const fallbackPreset = presets[0]

    let obj = {}
    propertyKeys.forEach(key => {
        if (syncedStorage.value?.[key] !== fallbackPreset[key]) obj[key] = syncedStorage.value[key]
    })

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
                <span>Catalogus</span>
            </button>
            <button v-if="storedThemes.length" class="tab" :class="{ active: selectedTab === 1 }" @click="selectedTab = 1">
                <span>Opgeslagen</span>
            </button>
            <button class="tab" :class="{ active: selectedTab === 2 }" @click="selectedTab = 2">
                <span>Bewerken</span>
            </button>
        </div>

        <div class="tab-content" id="theme-library" v-if="selectedTab === 0">
            <ThemePresets />
        </div>

        <div class="tab-content" id="theme-saved" v-else-if="selectedTab === 1">
            <div class="action-row" style="margin: 8px;">
                <button class="button tonal" @click="fileDialog.open">
                    <Icon>upload_file</Icon>
                    <span>Importeren</span>
                </button>
                <button v-if="!allPresets.some(p => presetsMatch(p))" class="button tonal" @click="storeCurrentTheme">
                    <Icon>library_add</Icon>
                    <span>Huidig thema opslaan</span>
                </button>
            </div>

            <div id="personal-presets">
                <button v-for="(preset, i) in storedThemes" class="theme-preset"
                    :class="{ matches: presetsMatch(preset) }" :title="preset.name" @click="promptPreset(preset)">
                    <MagisterThemePreview class="theme-preset-preview" :preset="preset" :scale="1.2" />
                    <div class="theme-preset-info">
                        <span class="theme-preset-name">Eigen thema</span>
                        <span class="theme-preset-author">{{ new Date(preset.date)?.toLocaleString('nl-NL') }}</span>
                    </div>
                    <div class="theme-actions">
                        <button @click.stop="deletePromptIndex = i; isDeletePromptActive = true"
                            title="Persoonlijk thema verwijderen">
                            <Icon>delete</Icon>
                        </button>
                        <a @click.stop title="Persoonlijk thema exporteren naar bestand"
                            :href="generatePresetUrl(preset)" :download="preset.date + '.sttheme'">
                            <Icon>file_export</Icon>
                        </a>
                    </div>
                </button>
            </div>
        </div>

        <div class="tab-content" id="theme-edit" v-else-if="selectedTab === 2">
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
            </div>
        </div>

        <Dialog v-model:active="isApplyPromptActive">
            <template #icon>format_paint</template>
            <template #headline>Let op!</template>
            <template #text>
                Je hebt wijzigingen aangebracht aan je thema. Als je dit thema nu toepast, dan gaan je huidige thema en
                al je aangepaste themavoorkeuren verloren.
            </template>
            <template #buttons>
                <button @click="applyPreset(); isApplyPromptActive = false">Toepassen</button>
                <button @click="isApplyPromptActive = false">Annuleren</button>
            </template>
        </Dialog>

        <Dialog v-model:active="isDeletePromptActive">
            <template #icon>delete</template>
            <template #headline>Thema verwijderen?</template>
            <template #text>
                Deze actie kan niet ongedaan worden gemaakt.
            </template>
            <template #buttons>
                <button
                    @click="storedThemes = storedThemes.filter((v, i) => i !== deletePromptIndex); isDeletePromptActive = false">Verwijderen</button>
                <button @click="isDeletePromptActive = false">Annuleren</button>
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

#personal-presets {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin: 8px;

    .theme-preset {
        position: relative;
        display: flex;
        gap: 12px;
        padding: 0;
        margin: 0;
        padding: 8px;
        background-color: var(--color-surface-container);
        border: none;
        border-radius: 12px;
        cursor: pointer;

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

        .theme-preset-name {
            font: var(--typescale-body-medium);
            color: var(--color-on-surface-container);
        }

        .theme-preset-author,
        .theme-preset-date {
            font: var(--typescale-body-small);
            color: var(--color-on-surface-variant);
        }

        .theme-actions {
            display: flex;
            gap: 8px;
            margin-left: auto;
            align-items: center;
            justify-content: center;

            a,
            button {
                background-color: transparent;
                border: none;
                color: var(--color-on-surface-variant);
                cursor: pointer;
            }
        }

        &.matches {
            background-color: var(--color-primary-container);
            outline: 1px solid var(--color-outline);

            .theme-preset-preview {
                outline: 1px solid var(--color-outline);
            }
        }
    }
}
</style>