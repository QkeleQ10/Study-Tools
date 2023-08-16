<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

import BottomSheet from './BottomSheet.vue';

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])
const value = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
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
        }, 1000)
    }, { once: true })
}

function formatKey(string) {
    if (!string) return string
    if (string === ' ') return "Spatie"
    return string.charAt(0).toUpperCase() + string.slice(1)
}

</script>

<template>
    <div class="setting key-picker" ref="label">
        <div class="key-picker-click-layer" @click="promptKey">
            <div>
                <h3 class="setting-title">
                    <slot name="title"></slot>
                </h3>
                <span class="setting-subtitle">
                    <slot name="subtitle"></slot> Huidig: {{ formatKey(value) }}
                </span>
            </div>
        </div>
        <BottomSheet v-model:active="pickerOpen" :handle=true>
            <template #content>
                <span class="supporting-text">Druk op een toets</span>
                <span class="key-picker-selected" :class="{ selected: selected }">{{ formatKey(value) }}</span>
            </template>
        </BottomSheet>
    </div>
</template>

<style>
.key-picker-click-layer {
    margin-left: -16px;
    margin-right: -24px;
    margin-block: -12px;
    padding-left: 16px;
    padding-right: 24px;
    padding-block: 12px;
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

@keyframes lockInKey {
    to {
        scale: 1.3;
    }
}
</style>