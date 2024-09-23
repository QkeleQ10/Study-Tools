<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

import BottomSheet from './BottomSheet.vue'

const props = defineProps(['modelValue', 'id', 'allowClear'])
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

let pickerOpen = ref(false)
let selected = ref(false)

function promptKey() {
    pickerOpen.value = true
    document.addEventListener('keydown', e => {
        if (!pickerOpen.value) return
        value.value = e.key
        selected.value = true
        setTimeout(() => {
            pickerOpen.value = false
            selected.value = false
        }, 500)
    }, { once: true })
}

function clearKey() {
    value.value = ''
    selected.value = true
    setTimeout(() => {
        pickerOpen.value = false
        selected.value = false
    }, 500)
}

function formatKey(string) {
    if (!string) return string
    if (string === ' ') return "Spatie"
    return string.charAt(0).toUpperCase() + string.slice(1)
}

</script>

<template>
    <div class="key-input">
        <button @click="promptKey">{{ formatKey(value) || '⋯' }}</button>
        <BottomSheet v-model:active="pickerOpen" :handle=true>
            <template #content>
                <span class="supporting-text">Druk op een toets</span>
                <span class="key-picker-selected" :class="{ selected: selected }">{{ formatKey(value) || "Geen geselecteerd" }}</span>
                <button class="button text key-picker-clear" v-if="allowClear" @click="clearKey">Wissen</button>
            </template>
        </BottomSheet>
    </div>
</template>

<style>
.key-input>button {
    height: 56px;
    width: 56px;
    outline: 1px solid var(--color-outline);
    border: none;
    border-radius: 4px;
    background-color: transparent;
    font: var(--typescale-body-large);
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition:  outline-color 200ms;
}

.key-input>button:hover {
    outline-color: var(--color-on-surface);
}

.key-picker-selected {
    display: inline-block;
    width: auto;
    color: var(--color-on-surface);
    font: var(--typescale-headline-small);
    opacity: 40%;
    transition: opacity 200ms;
}

.key-picker-selected.selected {
    opacity: 1;
    animation: lockInKey 200ms 2 alternate;
}

.key-picker-clear {
    position: absolute;
    right: 32px;
    bottom: 48px;
}

@keyframes lockInKey {
    to {
        scale: 1.3;
    }
}
</style>