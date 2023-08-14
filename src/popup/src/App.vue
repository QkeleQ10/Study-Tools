<script setup>
import { ref } from 'vue'
import { useScroll } from '@vueuse/core'
import { useSyncedStorage } from './composables/syncedStorage.js'

import settings from '../public/settings.js'

import TopAppBar from './components/TopAppBar.vue'
import NavigationBar from './components/NavigationBar.vue'
import SwitchInput from './components/SwitchInput.vue'
import SegmentedButton from './components/SegmentedButton.vue'
import SlideInput from './components/SlideInput.vue'
import ColorPicker from './components/ColorPicker.vue'

const main = ref(null)
const { y } = useScroll(main)
const syncedStorage = useSyncedStorage()

const optionTypes = { SwitchInput, SegmentedButton, SlideInput, ColorPicker }

let selectedCategory = ref('appearance')
</script>

<template>
    <TopAppBar :data-scrolled="y > 16" />
    <main id="main" ref="main">
        <!-- MAKE THIS SCROLLABLE RATHER THAN HAVING THE ENTIRE BODY SCROLL -->
        <!-- {{ syncedStorage }} -->
        <TransitionGroup tag="div" id="options-container" mode="out-in">
            <div v-for="category in settings" v-show="category.id === selectedCategory" :key="category.id">
                <component v-for="setting in category.settings" :key="setting.id"
                    :is="optionTypes[setting.type || 'SwitchInput']" :id="setting.id" v-model="syncedStorage[setting.id]"
                    :options="setting.options">
                    <template #title>{{ setting.title }}</template>
                    <template #subtitle>{{ setting.subtitle }}</template>
                </component>
            </div>
        </TransitionGroup>
    </main>
    <NavigationBar v-model="selectedCategory" />
</template>

<style>
@import url(assets/variables.css);
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');


body {
    width: 450px;
    height: 600px;
    margin: 0;
    background-color: var(--color-surface);
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
    overflow: auto;
}

#options-container {
    display: flex;
    flex-direction: column;
}

.setting {
    padding-left: 16px;
    padding-right: 24px;
    padding-block: 12px;
    background-color: var(--color-surface);
}
</style>
