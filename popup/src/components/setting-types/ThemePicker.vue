<script setup>
import { computed, defineProps, defineEmits } from 'vue'

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        let v = props.modelValue || themePresets[0].codepoint
        let [scheme, h, s, l] = v.split(',')
        return { scheme, color: { h, s, l } }
    },
    set(value) {
        emit('update:modelValue', `${value.scheme},${value.color.h},${value.color.s},${value.color.l}`)
    }
})

const themePresets = [
    {
        scheme: 'light',
        color: { h: 207, s: 95, l: 55 },
        codepoint: 'light,207,95,55'
    },
    {
        scheme: 'light',
        color: { h: 161, s: 51, l: 41 },
        codepoint: 'light,161,51,41'
    },
    {
        scheme: 'dark',
        color: { h: 207, s: 95, l: 55 },
        codepoint: 'dark,207,95,55'
    },
    {
        scheme: 'dark',
        color: { h: 161, s: 51, l: 41 },
        codepoint: 'dark,161,51,41'
    },
]

// const colorPresets = [
//     { name: "Azuurblauw", h: 207, s: 95, l: 55 }, // default blue
//     { name: "Zeegroen", h: 161, s: 51, l: 41 }, // green
//     { name: "Mosgroen", h: 90, s: 41, l: 41 }, // lime
//     { name: "Oranjegeel", h: 40, s: 51, l: 41 }, // yellow
//     { name: "Bloedrood", h: 1, s: 51, l: 41 }, // red
//     { name: "Rozerood", h: 341, s: 61, l: 41 }, // pink
//     { name: "Lavendelpaars", h: 290, s: 41, l: 41 }, // purple
//     { name: "Bosbespaars", h: 240, s: 41, l: 41 }, // indigo
// ]

function clickSwatch(swatch) {
    value.value = swatch
    if (themesMatch(swatch)) alert(("Invoke thing"))
}

function themesMatch(theme1, theme2 = value.value) {
    return (`${theme1.scheme},${theme1.color.h},${theme1.color.s},${theme1.color.l}` === `${theme2.scheme},${theme2.color.h},${theme2.color.s},${theme2.color.l}`)
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
        <div class="theme-picker-example" :style="{ 'background-color': `var(--mg-bk-${value.scheme}-1)` }">
            <div style="position: absolute; left: 0; top: 0; width: 25%; height: 100%"
                :style="{ 'background-color': `hsl(${value.color.h} ${value.color.s} ${value.color.l})` }"></div>
            <div
                style="position: absolute; left: 4%; top: 10%; width: 15%; height: 7%; border-radius: 100vmax; background-color: #ffffff88;">
            </div>
            <div style="position: absolute; left: 29%; top: 10%; width: 20%; height: 7%; border-radius: 100vmax;"
                :style="{ 'background-color': `hsl(${value.color.h} ${value.color.s} ${value.color.l})` }"></div>
            <div style="position: absolute; right: 0; top: 0; width: 30%; height: 100%"
                :style="{ 'background-color': `var(--mg-bk-${value.scheme}-2)` }"></div>
        </div>
        <div class="theme-picker-swatches-list">
            <div v-for="swatch in themePresets" :key="swatch.codepoint" class="theme-picker-swatch"
                :class="{ current: themesMatch(swatch) }" @click="clickSwatch(swatch)">
                <div class="theme-picker-swatch-example" style="transform: rotate(45deg);"
                    :style="{ 'background-color': `var(--mg-bk-${swatch.scheme}-1)` }">
                    <div style="position: absolute; right: 0; top: 0; width: 50%; height: 100%;"
                        :style="{ 'background-color': `hsl(${swatch.color.h} ${swatch.color.s} ${swatch.color.l})` }">
                    </div>
                    <div style="position: absolute; right: 0; bottom: 0; width: 50%; height: 50%;"
                        :style="{ 'background-color': `hsl(${swatch.color.h} ${swatch.color.s} ${swatch.color.l})` }">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.setting.theme-picker {
    display: flex;
    flex-direction: column;
    padding-top: 0;
    background-color: var(--color-surface);
    border: 1px solid var(--color-outline-variant);
    border-radius: 12px;
    overflow: hidden;
}

.theme-picker-title {
    padding: 10px 16px;
    background-color: var(--color-surface-container);
    border-bottom: 1px solid var(--color-outline-variant);
    transition: background-color 200ms, color 200ms;
}

.theme-picker-example {
    position: relative;
    aspect-ratio: 2 / 1;
    display: flex;
    flex-direction: column;
    margin: 12px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-outline-variant);
    border-radius: 8px;
    overflow: hidden;
    transition: background-color 150ms;
}

.theme-picker-example * {
    transition: background-color 150ms;
}

.theme-picker-swatches-list {
    display: flex;
    justify-content: stretch;
    gap: 8px;
    margin-inline: 12px;
}

.theme-picker-swatch {
    width: 32px;
    aspect-ratio: 1;

    border-radius: 50%;
    outline: 1px solid var(--color-outline-variant);
    overflow: hidden;
    transition: scale 150ms, outline-color 150ms;
}

.theme-picker-swatch.current {
    outline-width: 2px;
    outline-color: var(--color-primary);
}

.theme-picker-swatch-example {
    position: relative;
    width: 100%;
    height: 100%;

    border-radius: 50%;
    outline: 1px solid var(--color-outline-variant);
    overflow: hidden;
    transition: scale 150ms;
}

.theme-picker-swatch.current .theme-picker-swatch-example,
.theme-picker-swatch:hover .theme-picker-swatch-example {
    scale: 0.75;
}
</style>