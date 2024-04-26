<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

import ColorPicker from '../inputs/ColorPicker.vue'
import SegmentedButton from '../inputs/SegmentedButton.vue'

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        let v = props.modelValue || defaultTheme.codepoint
        let [scheme, h, s, l] = v.split(',')
        return { scheme, color: { h, s, l } }
    },
    set(value) {
        emit('update:modelValue', `${value.scheme},${value.color.h},${value.color.s},${value.color.l}`)
    }
})

const prefersDarkColorScheme = ref(window.matchMedia?.('(prefers-color-scheme: dark)').matches)

const defaultTheme = {
    scheme: 'auto',
    color: { h: 207, s: 95, l: 55 },
    codepoint: 'auto,207,95,55'
}

function updateScheme(newScheme) {
    value.value = { ...value.value, scheme: newScheme }
}

function updateColor(newColor) {
    value.value = { ...value.value, color: newColor }
}
</script>

<template>
    <div class="setting theme-picker">

        <div class="theme-picker-title">
            <h3 class="setting-title">
                <slot name="title"></slot>
            </h3>
            <span class="setting-subtitle">
                <slot name="subtitle"></slot>
            </span>
        </div>

        <SegmentedButton class="theme-picker-scheme" :model-value="value.scheme" @update:model-value="updateScheme"
            :options="[
            { value: 'auto', icon: 'hdr_auto', title: 'Systeem', tooltip: prefersDarkColorScheme ? 'Op basis van browserthema (momenteel donker)' : 'Op basis van browserthema (momenteel licht)' },
            { value: 'light', icon: 'light_mode', title: 'Licht', tooltip: 'Licht thema' },
            { value: 'dark', icon: 'dark_mode', title: 'Donker', tooltip: 'Donker thema' }
        ]"  />

        <ColorPicker class="theme-picker-color" :model-value="value.color" @update:model-value="updateColor"
            :swatches-enabled="true" />

    </div>
</template>

<style scoped>
.theme-picker {
    display: grid;
    grid-template:
        'title title' auto
        'scheme scheme' auto
        'color color' auto
        / auto 1fr;

    gap: 10px;

    /* padding: 16px; */

    /* background-color: var(--color-surface-container);
    border-radius: 12px; */
}

.theme-picker-title {
    grid-area: title;

    position: relative;
    transition: background-color 200ms, color 200ms;
}

.theme-picker-scheme {
    grid-area: scheme;
    margin-top: -4px;
}

.theme-picker-color {
    grid-area: color;
    margin-top: -4px;
}
</style>