<script setup>
import { ref } from 'vue'
import { useScroll } from '@vueuse/core'
import { useSyncedStorage } from './composables/syncedStorage.js'

import settings from '../public/settings.js'

import TopAppBar from './components/TopAppBar.vue'
import NavigationBar from './components/NavigationBar.vue'
import SwitchInput from './components/SwitchInput.vue'
import SegmentedButton from './components/SegmentedButton.vue'
import TextInput from './components/TextInput.vue'
import SlideInput from './components/SlideInput.vue'
import ColorPicker from './components/ColorPicker.vue'
import KeyPicker from './components/KeyPicker.vue'
import ImageInput from './components/ImageInput.vue'
import SubjectEditor from './components/SubjectEditor.vue'
import PeriodEditor from './components/PeriodEditor.vue'
import ShortcutsEditor from './components/ShortcutsEditor.vue'
import About from './components/About.vue'
import Chip from './components/Chip.vue'

const main = ref(null)
const { y } = useScroll(main)
const syncedStorage = useSyncedStorage()

const optionTypes = { SwitchInput, SegmentedButton, TextInput, SlideInput, ColorPicker, KeyPicker, ImageInput, SubjectEditor, PeriodEditor, ShortcutsEditor }

let selectedCategory = ref('appearance')
let transitionName = ref('')

setTimeout(() => {
    transitionName.value = 'list'
}, 200)

function shouldShowSetting(setting) {
    let outcome = true
    if (setting?.conditions) {
        setting.conditions.forEach(condition => {
            let value
            if (condition.settingId) value = syncedStorage.value[condition.settingId]
            switch (condition.operator) {
                case 'equal':
                    if (value !== condition.value) {
                        outcome = false
                    }
                    break

                case 'not equal':
                    if (value === condition.value) {
                        outcome = false
                    }
                    break

                case 'defined':
                    if (!value) {
                        outcome = false
                    }
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
    <TopAppBar :scrolled="y > 16" @reset-settings="resetSettingDefaults" />
    <main id="main" ref="main">
        <div id="options-container">
            <About v-show="selectedCategory === 'about'" key="about" />
            <TransitionGroup tag="div" :name="transitionName" mode="out-in" v-for="category in settings"
                v-show="category.id === selectedCategory" :key="category.id">
                <div class="setting-wrapper" :class="{ visible: shouldShowSetting(setting), inline: setting.inline }"
                    v-for="setting in category.settings" v-show="shouldShowSetting(setting)" :key="setting.id">
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
            </TransitionGroup>
        </div>
    </main>
    <NavigationBar v-model="selectedCategory" @scroll-to-top="scrollToTop" />
</template>

<style>
@import url(assets/variables.css);
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');


body {
    width: 450px;
    height: 600px;
    margin: 0;
    overflow: hidden;
    background-color: var(--color-surface);
    transition: background-color 200ms;
}

#app {
    width: 100%;
    height: 100%;
    display: grid;
    grid-auto-rows: 64px auto 80px;
    overflow: hidden;
    font-family: 'Noto Sans', sans-serif;
}

main {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
}

#options-container {
    display: flex;
    flex-direction: column;
}

.setting-wrapper~.setting-wrapper.visible {
    border-top: 1px solid var(--color-surface-variant);
}

.setting-wrapper.inline {
    display: inline-block;
    margin-left: 16px;
    margin-right: -8px;
    margin-bottom: 16px;
    border-top: none !important;
}

.setting-wrapper>.chip {
    margin-left: 16px;
    margin-bottom: 16px;
}

.setting {
    padding-left: 16px;
    padding-right: 24px;
    padding-block: 12px;
    min-height: 56px;
    box-sizing: border-box;
    background-color: var(--color-surface);
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