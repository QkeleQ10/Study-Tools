<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { ColorTranslator } from 'colortranslator'
import { ColorPicker } from "vue3-colorpicker"
import "vue3-colorpicker/style.css"

import Icon from './Icon.vue'
import BottomSheet from './BottomSheet.vue'

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])
const value = computed({
    get() {
        return props.modelValue || swatches[0]
    },
    set(value) {
        emit('update:modelValue', ColorTranslator.toHSLObject(value))
    }
})

const swatches = [
    { h: 207, s: 95, l: 55 }, // default blue
    { h: 161, s: 51, l: 41 }, // green
    { h: 90, s: 41, l: 41 }, // lime
    { h: 40, s: 51, l: 41 }, // yellow
    { h: 1, s: 51, l: 41 }, // red
    { h: 341, s: 61, l: 41 }, // pink
    { h: 290, s: 41, l: 41 }, // purple
    { h: 240, s: 41, l: 41 }, // indigo
]
const supportsEyeDropper = window.EyeDropper

let pickerOpen = ref(false)

function colorsEqual(color1, color2) {
    return Math.abs(color1.h - color2.h) < 1 && Math.abs(color1.s - color2.s) < 1 && Math.abs(color1.l - color2.l) < 1
}

function eyeDropper() {
    // eslint-disable-next-line
    const eyeDropper = new EyeDropper()
    pickerOpen.value = false

    eyeDropper
        .open()
        .then((result) => {
            value.value = result.sRGBHex
        })
}
</script>

<template>
    <div class="setting color-picker">
        <div>
            <h3 class="setting-title">
                <slot name="title"></slot>
            </h3>
            <span class="setting-subtitle">
                <slot name="subtitle"></slot>
            </span>
        </div>
        <!--should the swatches have their own bottom-sheet for colour consistency?-->
        <div class="swatches-wrapper">
            <button v-for="(swatch, i) in swatches" :key="i" class="swatch" :style="{ '--h': swatch.h, '--s': swatch.s, '--l': swatch.l }"
                @click="value = swatch" :data-state="colorsEqual(value, swatch)">
                <Transition name="swatch-check">
                    <Icon v-if="colorsEqual(value, swatch)">check</Icon>
                </Transition>
            </button>
            <button class="custom-swatch" :style="{ '--h': value.h, '--s': value.s, '--l': value.l }"
                @click="pickerOpen = !pickerOpen" :data-state="swatches.every(swatch => !colorsEqual(value, swatch))">
                <Icon>palette</Icon>
            </button>
        </div>
        <BottomSheet v-model:active.lazy="pickerOpen" :handle="true">
            <template #content>
                <span class="supporting-text">Kleur kiezen</span>
                <ColorPicker is-widget picker-type="chrome" disable-history disable-alpha lang="En"
                    v-model:pure-color.lazy="value" />
                <button class="bottom-sheet-action" v-if="supportsEyeDropper" @click="eyeDropper">
                    <Icon>colorize</Icon>
                    <span>Pipet</span>
                </button>
                <!-- <button class="bottom-sheet-action" @click="pickerOpen = false">
                    <Icon>close</Icon>
                    <span>Sluiten</span>
                </button> -->
            </template>
        </BottomSheet>
    </div>
</template>

<style>
.setting.color-picker {
    display: grid;
    grid-template-rows: 1fr auto;
    gap: 6px;
}

.swatches-wrapper {
    display: flex;
    height: 40px;
    gap: 6px;
}

.swatches-wrapper>* {
    flex-grow: 1;
    border: none;
    border-radius: 28px;
    cursor: pointer;
    transition: border-radius 200ms, flex-grow 200ms, background-color 200ms;
}

.swatch,
.custom-swatch[data-state=true] {
    background-color: hsl(var(--h) calc(var(--s) * 1%) calc(var(--l) * 1%));
}

.swatches-wrapper>*[data-state=true] {
    flex-grow: 3;
}

.swatches-wrapper>*:hover,
.swatches-wrapper>*:focus-visible {
    border-radius: 10px;
}

.custom-swatch {
    flex-grow: 2;
    background-color: var(--color-secondary-container);
    color: var(--color-on-secondary-container);
}

.swatches-wrapper>* .icon {
    width: 0;
    translate: -12px;
    font-size: 24px;
    color: color-contrast(hsl(var(--h) calc(var(--s) * 1%) calc(var(--l) * 1%)) vs #fff, #000);
}

.vc-colorpicker {
    width: 100% !important;
    background-color: transparent !important;
    box-shadow: none !important;
    border-bottom: 1px solid var(--color-outline-variant);
    margin-bottom: 8px;
}

.vc-colorpicker--container {
    padding: 8px 0 8px !important;
}

.vc-display {
    display: none !important;
}

.swatch-check-enter-active,
.swatch-check-leave-active {
    transition: opacity 200ms, font-variation-settings 200ms;
}

.swatch-check-enter-from,
.swatch-check-leave-to {
    opacity: 0;
    font-variation-settings: 'WGHT' 0;
}
</style>