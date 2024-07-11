<script setup>
import { ref, provide } from 'vue'
import { useScroll } from '@vueuse/core'
import { useSyncedStorage } from './composables/chrome.js'

import settings from '../public/settings.js'

import NavigationRail from './components/NavigationRail.vue'
import SwitchInput from './components/SwitchInput.vue'
import SegmentedButton from './components/SegmentedButton.vue'
import TextInput from './components/TextInput.vue'
import SlideInput from './components/SlideInput.vue'
import ThemePicker from './components/setting-types/ThemePicker.vue'
import KeyPicker from './components/KeyPicker.vue'
import ImageInput from './components/ImageInput.vue'
import ShortcutsEditor from './components/ShortcutsEditor.vue'
import ColorOverrideSetting from './components/setting-types/ColorOverrideSetting.vue'
import DecorationPickerSetting from './components/setting-types/DecorationPickerSetting.vue'
import DecorationSizeSetting from './components/setting-types/DecorationSizeSetting.vue'
import About from './components/About.vue'
import ThemePresets from './components/ThemePresets.vue'
import Chip from './components/Chip.vue'

const main = ref(null)
const themePickerState = ref(0)
const { y } = useScroll(main)
const syncedStorage = useSyncedStorage()

provide('syncedStorage', syncedStorage)
provide('themePickerState', themePickerState)

const optionTypes = { SwitchInput, SegmentedButton, TextInput, SlideInput, ThemePicker, KeyPicker, ImageInput, ShortcutsEditor, ColorOverrideSetting, DecorationPickerSetting, DecorationSizeSetting }

let selectedCategory = ref('theme')
let transitionName = ref('')

setTimeout(() => transitionName.value = 'list', 200)

function shouldShowSetting(setting) {
    let outcome = true
    if (setting?.conditions) {
        setting.conditions.forEach(condition => {
            let value
            if (condition.settingId) value = syncedStorage.value[condition.settingId]
            switch (condition.operator) {
                case 'equal':
                    if (value !== condition.value)
                        outcome = false
                    break

                case 'not equal':
                    if (value === condition.value)
                        outcome = false
                    break

                case 'starting with':
                    if (!value?.startsWith(condition.value))
                        outcome = false
                    break

                case 'not starting with':
                    if (value?.startsWith(condition.value))
                        outcome = false
                    break

                case 'defined':
                    if (!value)
                        outcome = false
                    break
            }
        })
    }
    return outcome
}

function resetSettingDefaults() {
    settings.forEach(category => {
        category.settings.forEach(setting => {
            syncedStorage.value[setting.id] = setting.default
        })
    })
}

function scrollToTop(change) {
    main.value.scrollTo({ top: 0, left: 0, behavior: change ? 'instant' : 'smooth' })
}

function openInNewTab(url) {
    window.open(url, '_blank', 'noreferrer')
}
</script>

<template>
    <div id="app-wrapper">
        <NavigationRail v-model="selectedCategory" @scroll-to-top="scrollToTop" :data-scrolled="y > 16" />
        <main id="main" ref="main">
            <div id="options-container">
                <TransitionGroup name="fade">
                    <template v-for="category in settings">
                        <div class="options-category" v-if="category.id === selectedCategory" :key="category.id">
                            <TransitionGroup :name="transitionName">
                                <ThemePresets v-if="category.id === 'theme' && themePickerState === 0" key="theme" />
                                <About v-if="category.id === 'about'" key="about"
                                    @reset-settings="resetSettingDefaults" />
                                <template v-for="setting in category.settings"
                                    v-if="!(category.id === 'theme' && themePickerState === 0)">
                                    <div class="setting-wrapper"
                                        :class="{ visible: shouldShowSetting(setting), inline: setting.inline }"
                                        :data-setting-type="setting.type" :data-setting-id="setting.id"
                                        v-if="shouldShowSetting(setting)" :key="setting.id" :data-scrolled="y > 16">
                                        <component :is="optionTypes[setting.type || 'SwitchInput']" :setting="setting"
                                            :id="setting.id" v-model="syncedStorage[setting.id]">
                                            <template #title>{{ setting.title }}</template>
                                            <template #subtitle>{{ setting.subtitle }}</template>
                                        </component>
                                        <Chip v-for="link in setting.links" :key="link.label"
                                            @click="openInNewTab(link.href)">
                                            <template #icon>{{ link.icon }}</template>
                                            <template #label>{{ link.label }}</template>
                                        </Chip>
                                    </div>
                                </template>
                            </TransitionGroup>
                        </div>
                    </template>
                </TransitionGroup>
            </div>
        </main>
    </div>
</template>

<style>
@import url(assets/variables.css);
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');


body {
    width: 530px;
    height: 600px;
    margin: 0;
    overflow: hidden;
    background-color: var(--color-surface);
    transition: background-color 200ms;
}

#app {
    width: 100%;
    height: 100%;
}

#app-wrapper {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template:
        /* 'rail header' 64px */
        'rail content' auto
        / 80px 450px;
    overflow: hidden;
    font-family: 'Noto Sans', sans-serif;
    transition: background-color 200ms;
}

main {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
}

#options-container {
    display: flex;
    flex-direction: column;
    padding-top: 16px;
}

.options-category {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: auto;
}

.setting-wrapper {
    margin-inline: 16px;
    grid-column: span 2;
}

.setting-wrapper[data-setting-id="decoration"],
.setting-wrapper[data-setting-id="decoration-size"],
.setting-wrapper[data-setting-id="wallpaper"] {
    border-top: none !important;
    margin-top: -10px;
}

.setting-wrapper+.setting-wrapper.visible {
    border-top: 1px solid var(--color-surface-variant);
}

.setting-wrapper[data-setting-type="ThemePicker"] {
    border-top: none !important;
    margin-inline: 8px;
}

.setting-wrapper[data-setting-type="ThemePicker"]+.setting-wrapper.visible {
    border-top: 0px solid transparent;
}

.setting-wrapper.inline {
    display: inline-block;
    margin-left: 16px;
    margin-right: -8px;
    margin-bottom: 16px;
    border-top: none !important;
}

.setting-wrapper>.chip {
    margin-bottom: 16px;
}

.setting {
    padding-block: 12px;
    min-height: 56px;
    box-sizing: border-box;
    transition: background-color 200ms;
}

.setting-title {
    margin: 0;
    color: var(--color-on-surface);
    font: var(--typescale-body-large);
}

.setting-subtitle {
    margin: 0;
    color: var(--color-on-surface-variant);
    font: var(--typescale-body-medium);
    text-wrap: balance;
}

.sticky-header {
    position: sticky;
    top: 0;
    padding-top: 12px;
    padding-bottom: 8px;
    background-color: var(--color-surface);
    z-index: 6;
}

.scrim {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    pointer-events: none;
    opacity: 0;
    background-color: var(--color-scrim);
    transition: opacity 200ms;
}

.scrim[active=true] {
    pointer-events: all;
    opacity: .3;
}

.icon-button {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 40px;
    width: 40px;
    background-color: transparent;
    border: none;
    border-radius: 50%;
    cursor: pointer;
}

.icon-button .icon {
    font-size: 24px;
    color: var(--color-on-surface-variant);
    font-variation-settings: 'FILL' 0;
    transition: font-variation-settings 200ms;
}

.icon-button[data-state=true] .icon {
    color: var(--color-primary);
    font-variation-settings: 'FILL' 1;
}

.button {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding-inline: 24px;
    border-radius: 20px;
    background-color: var(--color-primary);
    color: var(--color-on-primary);
    font: var(--typescale-label-large);
    border: none;
    cursor: pointer;
}

.button.tonal {
    background-color: var(--color-secondary-container);
    color: var(--color-on-secondary-container)
}

.button.text {
    background-color: transparent;
    color: var(--color-primary);
    padding-inline: 12px;
}

.button.inline {
    display: inline;
    padding: 0;
    height: auto;
    font-size: inherit;
}

.button .icon {
    font-size: 18px;
    margin-left: -8px;
}

.element-action {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    color: var(--color-on-surface-variant);
    border: none;
    border-radius: 14px;
    font-size: 24px;
    cursor: pointer;
}

.keybind {
    display: inline-block;
    height: 24px;
    min-width: 24px;
    box-sizing: border-box;
    padding: 4px 6px;
    margin-left: 4px;
    background-color: var(--color-surface-container-highest);
    color: var(--color-on-surface-variant);
    border-radius: 6px;
    font: var(--typescale-body-small);
    text-align: center;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 100ms ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.fade-leave,
.fade-leave-active {
    position: absolute;
}

.list-enter-active,
.list-leave-active {
    transition: all 200ms ease;
}

.list-enter-active {
    transition-delay: 200ms;
    animation: delayShow 200ms normal forwards step-end;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    border-bottom: none;
    transform: translateX(-30px);
}

@keyframes delayShow {
    0% {
        position: absolute;
    }

    100% {
        position: static;
    }
}
</style>