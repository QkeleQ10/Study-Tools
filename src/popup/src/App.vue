<script setup>
import { ref } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useSyncedStorage } from './composables/syncedStorage.js'

import settings from '../public/settings.js'

import TopAppBar from './components/TopAppBar.vue'
import NavigationBar from './components/NavigationBar.vue'
import SwitchInput from './components/SwitchInput.vue'
import SegmentedButton from './components/SegmentedButton.vue'

const { y } = useWindowScroll()
const syncedStorage = useSyncedStorage()

let storedSettings = ref({})

const optionTypes = { SwitchInput, SegmentedButton }
</script>

<template>
    <TopAppBar :data-scrolled="y > 16" />
    <main>
        {{ storedSettings }}
        {{ syncedStorage }}
        <TransitionGroup tag="div" id="options-container">
            <div v-for="category in settings" :key="category.id">
                <component v-for="setting in category.settings" :key="setting.id"
                    :is="optionTypes[setting.type || 'SwitchInput']" :id="setting.id" v-model="storedSettings[setting.id]"
                    :options="setting.options">
                    <template #title>{{ setting.title }}</template>
                    <template #subtitle>{{ setting.subtitle }}</template>
                </component>
            </div>
        </TransitionGroup>
    </main>
    <NavigationBar />
</template>

<style>
@import url(assets/variables.css);
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

body {
    margin: 0;
    background-color: var(--color-surface);
}

#app {
    font-family: 'Noto Sans', sans-serif;
}

main {
    padding-top: 64px;
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
