<script setup>
import { ref, inject } from 'vue'
import { useStorage } from '@vueuse/core'
import settings from '/public/settings.js'

import SwitchInput from '@/components/SwitchInput.vue'
import SlideInput from '@/components/SlideInput.vue'
import KeyPicker from '@/components/KeyPicker.vue'
import ImageInput from '@/components/ImageInput.vue'
import ShortcutsEditor from '@/components/ShortcutsEditor.vue'
import Text from '@/components/setting-types/Text.vue'
import SingleChoice from '@/components/setting-types/SingleChoice.vue'
import ColorOverrideSetting from '@/components/setting-types/ColorOverrideSetting.vue'
import DecorationPickerSetting from '@/components/setting-types/DecorationPickerSetting.vue'
import DecorationSizeSetting from '@/components/setting-types/DecorationSizeSetting.vue'
import LinkToOptionsTab from '@/components/setting-types/LinkToOptionsTab.vue'
const optionTypes = { SwitchInput, SlideInput, KeyPicker, ImageInput, ShortcutsEditor, Text, SingleChoice, ColorOverrideSetting, DecorationPickerSetting, DecorationSizeSetting, LinkToOptionsTab }

const syncedStorage = inject('syncedStorage')

const selectedTab = useStorage('selected-tab-theme', 0)
</script>

<template>
    <div class="options-category">
        <div class="tabs">
            <button class="tab" :class="{ active: selectedTab === 0 }" @click="selectedTab = 0">
                <span>Thema-presets</span>
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
                <template v-for="setting in settings[0].settings.slice(1)">
                    <div class="setting-wrapper" :data-setting-id="setting.id">
                        <component :is="optionTypes[setting.type || 'SwitchInput']" :setting="setting" :id="setting.id"
                            v-model="syncedStorage[setting.id]">
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
    background-color: var(--color-surface-container);
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    margin-inline: 4px;
}

.additional-options>*:nth-child(n+2) {
    border-top: 1px solid var(--color-surface-variant);
}

.setting-wrapper[data-setting-id="decoration"],
.setting-wrapper[data-setting-id="decoration-size"],
.setting-wrapper[data-setting-id="wallpaper"] {
    border-top: none !important;
    margin-top: -10px;
}
</style>