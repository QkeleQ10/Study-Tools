<script setup>
/* eslint-disable */
// import Icon from './Icon.vue';

import { computed } from 'vue'

import Icon from './Icon.vue';
import ColorInput from 'vue-color-input'

const swatches = [
    { h: 207, s: .95, l: .55 }, // default blue
    { h: 161, s: .51, l: .41 }, // green
    { h: 40, s: .51, l: .41 }, // yellow
    { h: 1, s: .51, l: .41 }, // red
    { h: 331, s: .51, l: .41 }, // pink
    { h: 266, s: .41, l: .41 } // purple
]

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        return props.modelValue || swatches[0]
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

function colorsEqual(color1, color2) {
    return Math.abs(color1.h - color2.h) < 1 && Math.abs(color1.s - color2.s) < .01 && Math.abs(color1.l - color2.l) < .01
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
        <div class="swatches-wrapper">
            <button v-for="swatch in swatches" class="swatch" :style="{ '--h': swatch.h, '--s': swatch.s, '--l': swatch.l }"
                @click="value = swatch" :data-state="colorsEqual(value, swatch)"></button>
            <div class="color-picker-custom-swatch" :style="{ '--h': value.h, '--s': value.s, '--l': value.l }">
                <ColorInput v-model="value" disable-alpha disable-text-inputs format="hsl object" position="bottom left"
                    transition="picker" :data-state="swatches.every(swatch => !colorsEqual(value, swatch))" />
                <Icon class="color-picker-custom-swatch-icon">colorize</Icon>
                <div class="color-picker-custom-swatch-scrim scrim"></div>
            </div>
        </div>
    </div>
</template>

<style>
.swatches-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(28px, 1fr));
}

.swatch {
    aspect-ratio: 1;
    border: none;
    background-color: hsl(var(--h) calc(var(--s) * 100%) calc(var(--l) * 100%));
    transition: border-radius 200ms;
}

.swatch[data-state=true],
.color-input.user[data-state=true] .box {
    border-radius: 50% !important;
}

.swatch:hover,
.swatch:focus-visible,
.color-input.user:hover .box,
.color-input.user:focus-visible .box,
.color-input.user .box.active {
    border-radius: 12px;
}

.color-input.user .box .inner {
    border-radius: 0;
}

.color-input.user,
.color-input.user .box {
    width: 100%;
    height: 100%;
}

.color-input.user .box {
    border-radius: 0;
    transition: border-radius 200ms;
}

.color-input.user .box.active .inner {
    transform: none;
}

.color-input.user .picker-popup {
    position: fixed;
    top: auto !important;
    bottom: 0;
    left: 0;
    padding: 24px;
    border-radius: 28px 28px 0 0;
    margin: 0;
    z-index: 10001;
    box-shadow: none;
    background-color: var(--color-surface-container-low);
}

.color-picker-custom-swatch-scrim {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    pointer-events: none;
    opacity: 0;
    background-color: var(--color-scrim);
    transition: opacity 200ms;
}

.color-picker-custom-swatch:has(.box.active) .color-picker-custom-swatch-scrim {
    pointer-events: all;
    opacity: .3;
}

/* .color-input.user .picker-popup:before {
    content: '';
    display: block;
    margin-block: 22px;
    margin-inline: auto;
    height: 4px;
    width: 32px;
    opacity: 40%;
    border-radius: 2px;
    background-color: var(--color-on-surface-variant);
} */

.color-picker-custom-swatch {
    position: relative;
}

.color-picker-custom-swatch-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    pointer-events: none;
    color: color-contrast(hsl(var(--h) calc(var(--s) * 100%) calc(var(--l) * 100%)) vs var(--color-on-primary), var(--color-on-primary-container));
}

.picker-enter-from,
.picker-leave-to {
    translate: 0 100%;
}

.picker-enter-active,
.picker-leave-active {
    transition: translate 200ms ease;
}
</style>