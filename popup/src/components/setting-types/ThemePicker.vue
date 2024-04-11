<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';

import ColorPicker from '../inputs/ColorPicker.vue';
import SegmentedButton from '../inputs/SegmentedButton.vue';

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

const parsedScheme = computed(() => {
    let scheme = value.value.scheme
    if (scheme === 'auto') scheme = prefersDarkColorScheme.value ? 'dark' : 'light'
    return scheme
})


function correctColor() {
    const correctionSL = {
        light: {
            'accent-primary': '95% 55%',
            'accent-secondary': '95% 47%',
            'foreground-accent': '78% 43%'
        },
        dark: {
            'accent-primary': '73% 30%',
            'accent-secondary': '73% 22%',
            'foreground-accent': '53% 55%'
        }
    }

    return correctionSL[parsedScheme.value]
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

        <div class="theme-picker-example" :style="{ 'background-color': `var(--mg-bk-${parsedScheme}-1)` }">
            <div style="position: absolute; left: 0; top: 0; width: 5%; height: 100%"
                :style="{ 'background-color': `color-mix(in hsl, hsl(${value.color.h} ${value.color.s}% ${value.color.l}%), hsl(${value.color.h} ${correctColor()['accent-secondary']}))` }">
            </div>
            <div style="position: absolute; left: 5%; top: 0; width: 22%; height: 100%"
                :style="{ 'background-color': `color-mix(in hsl, hsl(${value.color.h} ${value.color.s}% ${value.color.l}%), hsl(${value.color.h} ${correctColor()['accent-primary']}))` }">
            </div>
            <div
                style="position: absolute; left: 9%; top: 10%; width: 14%; height: 7%; border-radius: 100vmax; background-color: #ffffff88;">
            </div>
            <div style="position: absolute; left: 32%; top: 10%; width: 20%; height: 7%; border-radius: 100vmax;"
                :style="{ 'background-color': `color-mix(in hsl, hsl(${value.color.h} ${value.color.s}% ${value.color.l}%), hsl(${value.color.h} ${correctColor()['foreground-accent']}))` }">
            </div>
            <div style="position: absolute; right: 30%; top: 0; width: 0.2%; height: 100%"
                :style="{ 'background-color': `var(--mg-br-${parsedScheme})` }"></div>
            <div style="position: absolute; right: 0; top: 0; width: 30%; height: 100%; border: 0.1vmax solid transparent;"
                :style="{ 'background-color': `var(--mg-bk-${parsedScheme}-2)`, 'border-color': `var(--mg-br-${parsedScheme})` }">
            </div>
            <div style="position: absolute; right: 3%; top: 6%; width: 24%; height: 20%; border-radius: 10%; border: 0.1vmax solid transparent;"
                :style="{ 'border-color': `var(--mg-br-${parsedScheme})`, 'background-image': `linear-gradient(color-mix(in hsl, hsl(${value.color.h} ${value.color.s}% ${value.color.l}%), hsl(${value.color.h} ${correctColor()['accent-primary']})), color-mix(in hsl, hsl(${value.color.h} ${value.color.s}% ${value.color.l}%), hsl(${value.color.h} ${correctColor()['accent-secondary']})))` }">
            </div>
            <div style="position: absolute; right: 3%; top: 30%; width: 24%; height: 28%; border-radius: 10%; border: 0.1vmax solid transparent;"
                :style="{ 'border-color': `var(--mg-br-${parsedScheme})` }">
            </div>
            <div style="position: absolute; right: 3%; top: 62%; width: 24%; height: 24%; border-radius: 10%; border: 0.1vmax solid transparent;"
                :style="{ 'border-color': `var(--mg-br-${parsedScheme})` }">
            </div>
        </div>

        <SegmentedButton class="theme-picker-scheme" :model-value="value.scheme" @update:model-value="updateScheme"
            :options="[
                { value: 'auto', icon: prefersDarkColorScheme ? 'night_sight_auto' : 'brightness_auto', tooltip: prefersDarkColorScheme ? 'Op basis van browserthema (momenteel donker)' : 'Op basis van browserthema (momenteel licht)' },
                { value: 'light', icon: 'light_mode', tooltip: 'Licht thema' },
                { value: 'dark', icon: 'dark_mode', tooltip: 'Donker thema' }
            ]" density="-1" />

        <ColorPicker class="theme-picker-color" :model-value="value.color" @update:model-value="updateColor"
            :swatches-enabled="true" />

    </div>
</template>

<style scoped>
.theme-picker {
    display: grid;
    grid-template:
        'title title' auto
        'example scheme' auto
        'example color' auto
        / auto 1fr;

    padding: 16px;

    background-color: var(--color-surface-container);
    border-radius: 12px;
}

.theme-picker-title {
    grid-area: title;

    position: relative;
    transition: background-color 200ms, color 200ms;
}

.theme-picker-example {
    grid-area: example;
    min-height: 115px;

    position: relative;
    aspect-ratio: 16 / 9;
    display: flex;
    flex-direction: column;
    margin-right: 12px;
    margin-top: 12px;

    background-color: var(--color-surface);
    outline: 1px solid var(--color-outline-variant);
    border: none;
    border-radius: 8px;
    overflow: hidden;
    transition: background-color 150ms;
}

.theme-picker-example * {
    transition: background-color 150ms;
}

.theme-picker-example:focus-visible {
    outline-width: 2px;
    outline-color: var(--color-on-surface);
}

.theme-picker-scheme {
    grid-area: scheme;
    margin-top: 8px;
}

.theme-picker-color {
    grid-area: color;
}
</style>