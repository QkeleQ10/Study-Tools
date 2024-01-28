<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import Icon from '../Icon.vue';

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

const prefersDarkColorScheme = ref(window.matchMedia?.('(prefers-color-scheme: dark)').matches)

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

const correctionSL = {
    light: {
        'accent-primary': '95 55',
        'accent-secondary': '95 47',
        'foreground-accent': '78 43'
    },
    dark: {
        'accent-primary': '73 30',
        'accent-secondary': '73 22',
        'foreground-accent': '53 55'
    }
}

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
    if (themesMatch(swatch)) alert(("Invoke customiser"))
}

function themesMatch(theme1, theme2 = value.value) {
    return (`${theme1.scheme},${theme1.color.h},${theme1.color.s},${theme1.color.l}` === `${theme2.scheme},${theme2.color.h},${theme2.color.s},${theme2.color.l}`)
}
</script>

<template>
    <div class="setting theme-picker">
        <div class="theme-picker-title"
            :class="{ current: (id === 'theme-night' && prefersDarkColorScheme) || (id === 'theme-day' && !prefersDarkColorScheme) || id === 'theme-fixed' }">
            <h3 class="setting-title">
                <slot name="title"></slot>
            </h3>
            <span class="setting-subtitle">
                <slot name="subtitle"></slot>
            </span>
            <Icon class="theme-picker-current"
                v-if="(id === 'theme-night' && prefersDarkColorScheme) || (id === 'theme-day' && !prefersDarkColorScheme)">
                check</Icon>
        </div>
        <button class="theme-picker-example" :style="{ 'background-color': `var(--mg-bk-${value.scheme}-1)` }">
            <div style="position: absolute; left: 0; top: 0; width: 5%; height: 100%"
                :style="{ 'background-color': `color-mix(in hsl, hsl(${value.color.h} ${value.color.s} ${value.color.l}), hsl(${value.color.h} ${correctionSL[value.scheme]['accent-secondary']}))` }">
            </div>
            <div style="position: absolute; left: 5%; top: 0; width: 22%; height: 100%"
                :style="{ 'background-color': `color-mix(in hsl, hsl(${value.color.h} ${value.color.s} ${value.color.l}), hsl(${value.color.h} ${correctionSL[value.scheme]['accent-primary']}))` }">
            </div>
            <div
                style="position: absolute; left: 9%; top: 10%; width: 14%; height: 7%; border-radius: 100vmax; background-color: #ffffff88;">
            </div>
            <div style="position: absolute; left: 32%; top: 10%; width: 20%; height: 7%; border-radius: 100vmax;"
                :style="{ 'background-color': `color-mix(in hsl, hsl(${value.color.h} ${value.color.s} ${value.color.l}), hsl(${value.color.h} ${correctionSL[value.scheme]['foreground-accent']}))` }">
            </div>
            <div style="position: absolute; right: 0; top: 0; width: 30%; height: 100%"
                :style="{ 'background-color': `var(--mg-bk-${value.scheme}-2)` }"></div>
            <div class="theme-picker-customise">
                <div></div>
                <Icon>edit</Icon>
                <span>Aanpassen</span>
            </div>
        </button>
        <div class="theme-picker-swatches-list">
            <button v-for="swatch in themePresets" :key="swatch.codepoint" class="theme-picker-swatch"
                :class="{ current: themesMatch(swatch) }" @click="clickSwatch(swatch)">
                <div class="theme-picker-swatch-example" style="transform: rotate(45deg);"
                    :style="{ 'background-color': `var(--mg-bk-${swatch.scheme}-1)` }">
                    <div style="position: absolute; right: 0; top: 0; width: 50%; height: 100%;"
                        :style="{ 'background-color': `color-mix(in hsl, hsl(${swatch.color.h} ${swatch.color.s} ${swatch.color.l}), hsl(${swatch.color.h} ${correctionSL[swatch.scheme]['accent-primary']}))` }">
                    </div>
                    <div style="position: absolute; right: 0; bottom: 0; width: 50%; height: 50%;"
                        :style="{ 'background-color': `color-mix(in hsl, hsl(${swatch.color.h} ${swatch.color.s} ${swatch.color.l}), hsl(${swatch.color.h} ${correctionSL[swatch.scheme]['accent-secondary']}))` }">
                    </div>
                </div>
            </button>
        </div>
    </div>
</template>

<style>
.setting.theme-picker {
    display: flex;
    flex-direction: column;
    padding-top: 0;
    margin-bottom: 12px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-outline-variant);
    border-radius: 12px;
    overflow: hidden;
}

.theme-picker-title {
    position: relative;
    padding: 10px 16px;
    border-bottom: 1px solid var(--color-outline-variant);
    transition: background-color 200ms, color 200ms;
}

.theme-picker-title.current {
    background-color: var(--color-surface-container);
}

.theme-picker-current {
    position: absolute;
    top: 10px;
    right: 16px;
}

.theme-picker-example {
    position: relative;
    aspect-ratio: 2 / 1;
    display: flex;
    flex-direction: column;
    margin: 12px;
    background-color: var(--color-surface);
    outline: 1px solid var(--color-outline-variant);
    border: none;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: background-color 150ms;
}

.theme-picker-example * {
    transition: background-color 150ms;
}

.theme-picker-example:focus {
    outline-width: 2px;
    outline-color: var(--color-on-surface);
}

.theme-picker-customise {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    opacity: 0;
    transition: opacity 150ms;
}

.theme-picker-example:hover>.theme-picker-customise,
.theme-picker-example:focus>.theme-picker-customise {
    opacity: 1;
}

.theme-picker-customise>div {
    position: absolute;
    inset: 0;
    background-color: var(--color-scrim);
    opacity: .5;
}

.theme-picker-customise>.icon,
.theme-picker-customise>span {
    z-index: 1;
    color: #fff;
}

.theme-picker-customise>span:not(.icon) {
    font: var(--typescale-body-medium);
}

.theme-picker-swatches-list {
    display: flex;
    justify-content: stretch;
    gap: 8px;
    margin-inline: 12px;
}

.theme-picker-swatch {
    position: relative;
    width: 32px;
    aspect-ratio: 1;

    background-color: transparent;
    padding: 0;
    border: none;
    border-radius: 50%;
    outline: 1px solid var(--color-outline-variant);
    overflow: hidden;
    cursor: pointer;
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
.theme-picker-swatch:hover .theme-picker-swatch-example ,
.theme-picker-swatch:focus-visible .theme-picker-swatch-example {
    scale: 0.75;
}

.theme-picker-swatch:focus-visible {
    outline-width: 2px;
    outline-color: var(--color-on-surface);
}
</style>