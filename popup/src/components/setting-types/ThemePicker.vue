<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { useElementSize } from '@vueuse/core';

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

const setting = ref(null)
const { width } = useElementSize(setting)

const prefersDarkColorScheme = ref(window.matchMedia?.('(prefers-color-scheme: dark)').matches)

const defaultTheme = {
    scheme: 'light',
    color: { h: 207, s: 95, l: 55 },
    codepoint: 'light,207,95,55'
}

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

function updateScheme(newScheme) {
    value.value = { ...value.value, scheme: newScheme }
}

function updateColor(newColor) {
    value.value = { ...value.value, color: newColor }
}
</script>

<template>
    <div class="setting theme-picker" ref="setting" :class="{ 'wide': width > 300 }">

        <div class="theme-picker-title"
            :class="{ current: (id === 'theme-night' && prefersDarkColorScheme) || (id === 'theme-day' && !prefersDarkColorScheme) || id === 'theme-fixed' }">
            <h3 class="setting-title">
                <slot name="title"></slot>
                <span
                    v-if="(id === 'theme-night' && prefersDarkColorScheme) || (id === 'theme-day' && !prefersDarkColorScheme)">
                    (huidig)</span>
            </h3>
            <span class="setting-subtitle">
                <slot name="subtitle"></slot>
            </span>
        </div>

        <div class="theme-picker-example" :style="{ 'background-color': `var(--mg-bk-${value.scheme}-1)` }">
            <div style="position: absolute; left: 0; top: 0; width: 5%; height: 100%"
                :style="{ 'background-color': `color-mix(in hsl, hsl(${value.color.h} ${value.color.s}% ${value.color.l}%), hsl(${value.color.h} ${correctionSL[value.scheme]['accent-secondary']}))` }">
            </div>
            <div style="position: absolute; left: 5%; top: 0; width: 22%; height: 100%"
                :style="{ 'background-color': `color-mix(in hsl, hsl(${value.color.h} ${value.color.s}% ${value.color.l}%), hsl(${value.color.h} ${correctionSL[value.scheme]['accent-primary']}))` }">
            </div>
            <div
                style="position: absolute; left: 9%; top: 10%; width: 14%; height: 7%; border-radius: 100vmax; background-color: #ffffff88;">
            </div>
            <div style="position: absolute; left: 32%; top: 10%; width: 20%; height: 7%; border-radius: 100vmax;"
                :style="{ 'background-color': `color-mix(in hsl, hsl(${value.color.h} ${value.color.s}% ${value.color.l}%), hsl(${value.color.h} ${correctionSL[value.scheme]['foreground-accent']}))` }">
            </div>
            <div style="position: absolute; right: 30%; top: 0; width: 0.2%; height: 100%"
                :style="{ 'background-color': `var(--mg-br-${value.scheme})` }"></div>
            <div style="position: absolute; right: 0; top: 0; width: 30%; height: 100%"
                :style="{ 'background-color': `var(--mg-bk-${value.scheme}-2)` }"></div>
            <div style="position: absolute; right: 2.5%; top: 6%; width: 24%; height: 20%; border-radius: 10%; border: 0.2vmax solid transparent;"
                :style="{ 'border-color': `var(--mg-br-${value.scheme})`, 'background-image': `linear-gradient(color-mix(in hsl, hsl(${value.color.h} ${value.color.s}% ${value.color.l}%), hsl(${value.color.h} ${correctionSL[value.scheme]['accent-primary']})), color-mix(in hsl, hsl(${value.color.h} ${value.color.s}% ${value.color.l}%), hsl(${value.color.h} ${correctionSL[value.scheme]['accent-secondary']})))` }">
            </div>
            <div style="position: absolute; right: 2.5%; top: 30%; width: 24%; height: 28%; border-radius: 10%; border: 0.2vmax solid transparent;"
                :style="{ 'border-color': `var(--mg-br-${value.scheme})` }">
            </div>
            <div style="position: absolute; right: 2.5%; top: 62%; width: 24%; height: 24%; border-radius: 10%; border: 0.2vmax solid transparent;"
                :style="{ 'border-color': `var(--mg-br-${value.scheme})` }">
            </div>
        </div>

        <SegmentedButton class="theme-picker-scheme" :model-value="value.scheme" @update:model-value="updateScheme"
            :options="[
                { value: 'light', icon: 'light_mode' },
                { value: 'dark', icon: 'dark_mode' }
            ]" density="-1" />

        <ColorPicker class="theme-picker-color" :model-value="value.color" @update:model-value="updateColor" />

    </div>
</template>

<style scoped>
.theme-picker {
    display: grid;
    grid-template:
        'title' auto
        'example' auto
        'scheme' auto
        'color' auto
        / 1fr;
    padding-top: 0;
    margin-bottom: 12px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-outline-variant);
    border-radius: 12px;
    overflow: hidden;
}

.theme-picker.wide {
    grid-template:
        'title title' auto
        'example scheme' auto
        'example color' auto
        / auto 1fr;
}

.theme-picker-title {
    grid-area: title;

    position: relative;
    padding: 10px 16px;
    border-bottom: 1px solid var(--color-outline-variant);
    transition: background-color 200ms, color 200ms;
}

.theme-picker-title.current {
    background-color: var(--color-surface-container);
}

.theme-picker-example {
    grid-area: example;

    position: relative;
    aspect-ratio: 16 / 9;
    display: flex;
    flex-direction: column;
    margin: 12px;
    background-color: var(--color-surface);
    outline: 1px solid var(--color-outline-variant);
    border: none;
    border-radius: 8px;
    overflow: hidden;
    transition: background-color 150ms;
}

.theme-picker.wide .theme-picker-example {
    min-height: 100px;
    margin-bottom: 0;
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

    margin-inline: 12px;
    margin-top: -4px;
}

.theme-picker.wide .theme-picker-scheme {
    margin-left: 0;
    margin-top: 8px;
}

.theme-picker-color {
    grid-area: color;

    margin-inline: 12px;
}

.theme-picker.wide .theme-picker-color {
    margin-left: 0;
}
</style>