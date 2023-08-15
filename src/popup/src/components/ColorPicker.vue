<script setup>
/* eslint-disable */

import { ref, computed } from 'vue'
import { ColorTranslator } from 'colortranslator'
import { ColorPicker } from "vue3-colorpicker";
import "vue3-colorpicker/style.css";

import Icon from './Icon.vue'

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])

const swatches = [
    { h: 207, s: 95, l: 55 }, // default blue
    { h: 161, s: 51, l: 41 }, // green
    { h: 40, s: 51, l: 41 }, // yellow
    { h: 1, s: 51, l: 41 }, // red
    { h: 331, s: 51, l: 41 }, // pink
    { h: 266, s: 41, l: 41 } // purple
]

let pickerOpen = ref(false)

const value = computed({
    get() {
        return props.modelValue || swatches[0]
    },
    set(value) {
        emit('update:modelValue', ColorTranslator.toHSLObject(value))
    }
})

function colorsEqual(color1, color2) {
    return Math.abs(color1.h - color2.h) < 1 && Math.abs(color1.s - color2.s) < 1 && Math.abs(color1.l - color2.l) < 1
}
</script>

<template>
    <div class="setting color-picker">
        <h3 class="setting-title">
            <slot name="title"></slot>
        </h3>
        <span class="setting-subtitle">
            <slot name="subtitle"></slot>
        </span>
        <!--should the swatches have their own bottom-sheet for colour consistency?-->
        <div class="swatches-wrapper">
            <button v-for="swatch in swatches" class="swatch" :style="{ '--h': swatch.h, '--s': swatch.s, '--l': swatch.l }"
                @click="value = swatch" :data-state="colorsEqual(value, swatch)"></button>
            <button class="custom-swatch" :style="{ '--h': value.h, '--s': value.s, '--l': value.l }"
                @click="pickerOpen = !pickerOpen" :data-state="swatches.every(swatch => !colorsEqual(value, swatch))">
                <Icon>palette</Icon>
            </button>
        </div>
        <div class="custom-color-picker">
            <div class="custom-color-picker-scrim scrim" :active="pickerOpen" @click="pickerOpen = false"></div>
            <div class="custom-color-picker-container bottom-sheet" :active="pickerOpen">
                <ColorPicker is-widget picker-type="chrome" disable-history disable-alpha lang="En"
                    v-model:pure-color="value" />
            </div>
        </div>
    </div>
</template>

<style>
.swatches-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
}

.swatches-wrapper>* {
    aspect-ratio: 1;
    border: none;
    transition: border-radius 200ms, background-color 200ms;
}

.swatch, .custom-swatch[data-state=true] {
    background-color: hsl(var(--h) calc(var(--s) * 1%) calc(var(--l) * 1%));
}

.swatches-wrapper>*[data-state=true] {
    border-radius: 50% !important;
}

.swatches-wrapper>*:hover,
.swatches-wrapper>*:focus-visible {
    border-radius: 12px;
}

.custom-swatch {
    background-color: var(--color-secondary-container);
    color: var(--color-on-secondary-container);
}

.custom-swatch .icon {
    font-size: 24px;
}
</style>