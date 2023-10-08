<script setup>
import { ref, defineEmits } from 'vue';

import Icon from './Icon.vue';
import Dialog from './Dialog.vue'

const emit = defineEmits(['resetSettings'])

const resetDialogActive = ref(false)

function resetSettings() {
    emit('resetSettings')
    resetDialogActive.value = false
}
</script>

<template>
    <header id="top-app-bar">
        <h1 id="app-heading">Study Tools</h1>
        <div id="top-app-bar-buttons">
            <button class="icon-button" @click="resetDialogActive = true">
                <Icon>restart_alt</Icon>
            </button>
        </div>
    </header>
    <Dialog v-model:active="resetDialogActive">
        <template #icon>restart_alt</template>
        <template #headline>Voorkeuren wissen?</template>
        <template #text>Hiermee stel je alle instellingen van Study Tools in op de standaardwaarden.</template>
        <template #buttons>
            <button @click="resetDialogActive = false">Annuleren</button>
            <button @click=resetSettings>Wissen</button>
        </template>
    </Dialog>
</template>

<style>
#top-app-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--color-surface);
    height: 64px;
    padding-inline: 16px;
    display: flex;
    align-items: center;
    z-index: 9999;
    transition: background-color 200ms;
}

#app-heading {
    font: var(--typescale-title-large);
    color: var(--color-on-surface);
    margin: 0;
}

#app-heading:after {
    content: '.';
    color: var(--mg-orange);
}
</style>