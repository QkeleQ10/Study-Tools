<script setup>
import { ref, computed, defineProps, defineEmits, inject } from 'vue'

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
    <div id="theme-colors">
        <MagisterThemePreview id="theme-preview" />

        <SegmentedButton id="theme-scheme" :model-value="value.scheme" @update:model-value="updateScheme" :options="[
            { value: 'auto', icon: 'hdr_auto', tooltip: prefersDarkColorScheme ? 'Op basis van browserthema (momenteel donker)' : 'Op basis van browserthema (momenteel licht)' },
            { value: 'light', icon: 'light_mode', tooltip: 'Licht thema' },
            { value: 'dark', icon: 'dark_mode', tooltip: 'Donker thema' }
        ]" />

        <ColorPicker id="theme-color" :model-value="value.color" @update:model-value="updateColor"
            :swatches-enabled="true" />
    </div>
</template>

<style scoped>
#theme-colors {
    display: grid;
    grid-template:
        'preview scheme' auto
        'preview color' auto
        / auto 1fr;
    gap: 16px;

    margin: 5px;
    margin-block: 16px;

    background-color: var(--color-surface);
}

#theme-preview {
    grid-area: preview;
    width: 200px;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    outline: 1px solid var(--color-outline-variant);
}

#theme-title {
    grid-area: title;
    position: relative;
}

#theme-scheme {
    grid-area: scheme;
    margin-top: -4px;
}

#theme-color {
    grid-area: color;
    margin-top: -4px;
}
</style>