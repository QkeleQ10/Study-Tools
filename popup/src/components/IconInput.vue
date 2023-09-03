<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

import BottomSheet from './BottomSheet.vue'

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue', 'input'])
const value = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
        emit('input', value)
    }
})

const iconCats = {
    "Media": '',
    "Technologie": '',
    "Kalenders": '',
    "Bestanden": '',
    "Personen": '',
    "Divers": '',
    "Cirkels": '',
    "Vierkanten": '',
    "Handen": '',
    "Emoticons": '',
}

let pickerOpen = ref(false)

function promptIcon() {
    pickerOpen.value = true
    let selectedEl = document.querySelector('.icon-picker-option.selected')
    if (selectedEl) selectedEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function setIcon(icon) {
    value.value = icon
    setTimeout(() => {
        pickerOpen.value = false
    }, 500)
}
</script>

<template>
    <div class="icon-input">
        <button @click="promptIcon">{{ value }}</button>
        <BottomSheet v-model:active="pickerOpen" :handle=true>
            <template #content>
                <!-- <span class="supporting-text">Kies een pictogram</span> -->
                <div class="icon-picker-all">
                    <div v-for="(icons, key) in iconCats" :key="key">
                        <span class="supporting-text">{{ key }}</span>
                        <div class="icon-picker-grid">
                            <button class="icon-picker-option" v-for="icon in icons.split('')" :key="icon"
                                :class="{ selected: value === icon }" @click="setIcon(icon)">{{ icon
                                }}</button>
                        </div>
                    </div>
                </div>
            </template>
        </BottomSheet>
    </div>
</template>

<style>
@font-face {
    font-family: "Font Awesome 5 Free";
    src: url("../assets/far.otf");
}

.icon-input {
    height: auto;
}

.icon-input>button {
    height: 56px;
    width: 56px;
    outline: 1px solid var(--color-outline);
    border: none;
    border-radius: 4px;
    background-color: transparent;
    font: 20px "Font Awesome 5 Free";
    overflow: hidden;
    cursor: pointer;
    transition: background-color 200ms, color 200ms, outline-color 200ms;
}

.icon-input>button:hover {
    outline-color: var(--color-on-surface);
}

.icon-picker-all {
    display: flex;
    flex-direction: column;
    gap: 16px;
    /* margin-top: 16px; */
    max-height: 60vh;
    overflow-y: auto;
    padding-inline: 24px;
    margin-inline: -24px;
    margin-bottom: -24px;
}

.icon-picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(56px, 1fr));
    height: auto;
    row-gap: 4px;
    justify-items: center;
}

.icon-picker-option {
    display: block;
    width: 48px;
    height: 48px;
    background-color: transparent;
    color: var(--color-on-surface);
    border: none;
    border-radius: 4px;
    font: 20px "Font Awesome 5 Free";
    cursor: pointer;
    transition: background-color 200ms, color 200ms;
}

.icon-picker-option.selected {
    background-color: var(--color-secondary-container);
    color: var(--color-on-secondary-container);
}
</style>