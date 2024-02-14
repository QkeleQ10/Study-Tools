<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import BottomSheet from '../BottomSheet.vue';
import Icon from '../Icon.vue';
import { useEyeDropper } from '@vueuse/core';

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        return props.modelValue || swatches[0].color
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

const { isSupported: eyeDropperSupported, open: openEyeDropper, sRGBHex: eyeDropperHEX } = useEyeDropper()

console.log(eyeDropperSupported)

const hueWheel = ref(null)

const pickerOpen = ref(false)

const swatches = [
    { name: "Azuurblauw", color: { h: 207, s: 95, l: 55 } }, // default blue
    { name: "Zeegroen", color: { h: 161, s: 51, l: 41 } }, // green
    { name: "Mosgroen", color: { h: 90, s: 41, l: 41 } }, // lime
    { name: "Oranjegeel", color: { h: 40, s: 51, l: 41 } }, // yellow
    { name: "Bloedrood", color: { h: 10, s: 51, l: 41 } }, // red
    { name: "Rozerood", color: { h: 341, s: 61, l: 41 } }, // pink
    { name: "Lavendelpaars", color: { h: 290, s: 41, l: 41 } }, // purple
    { name: "Bosbespaars", color: { h: 240, s: 41, l: 41 } }, // indigo
]

function isSelected(color) {
    return (color.h == value.value.h && color.s == value.value.s && color.l == value.value.l)
}

function hueWheelClick(event) {
    const rect = event.currentTarget.getBoundingClientRect()

    // Calculate the distance from the center of the circle
    const offsetX = event.clientX - rect.left - rect.width / 2
    const offsetY = event.clientY - rect.top - rect.height / 2

    // Calculate the angle in radians
    let angle = Math.atan2(offsetY, offsetX)

    // Convert radians to degrees
    angle = ((angle * 180) / Math.PI) + 90

    // Adjust the angle to start from the top and increase clockwise
    angle = angle < 0 ? 360 + angle : angle

    value.value = { ...value.value, h: Math.floor(angle) }
}

function saturationBarClick(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = (event.clientX - rect.left) / rect.width * 100
    value.value = { ...value.value, s: Math.floor(offsetX) }
}

function luminanceBarClick(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = (event.clientX - rect.left) / rect.width * 100
    value.value = { ...value.value, l: Math.floor(offsetX) }
}

async function invokeEyeDropper() {
    await openEyeDropper()
    if (eyeDropperHEX.value) {
        value.value = hexToHSL(eyeDropperHEX.value)
    }
}

function hexToHSL(H) {
    // Convert hex to RGB first
    let r = 0, g = 0, b = 0;
    if (H.length == 4) {
        r = "0x" + H[1] + H[1];
        g = "0x" + H[2] + H[2];
        b = "0x" + H[3] + H[3];
    } else if (H.length == 7) {
        r = "0x" + H[1] + H[2];
        g = "0x" + H[3] + H[4];
        b = "0x" + H[5] + H[6];
    }
    // Then to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    if (delta == 0)
        h = 0;
    else if (cmax == r)
        h = ((g - b) / delta) % 6;
    else if (cmax == g)
        h = (b - r) / delta + 2;
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0)
        h += 360;

    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return ({ h, s, l });
}
</script>

<template>
    <div class="color-picker">
        <div class="gallery">
            <div class="swatches">
                <button v-for="swatch in swatches" class="swatch" :class="{ 'selected': isSelected(swatch.color) }"
                    :key="swatch.name" :title="swatch.name"
                    :style="{ 'background-color': `hsl(${swatch.color.h} ${swatch.color.s}% ${swatch.color.l}%` }"
                    @click="value = swatch.color"></button>
            </div>
            <button class="custom"
                style="background-image: radial-gradient(var(--color-surface-container) 66%, transparent calc(66% + 2px)), conic-gradient(in hsl longer hue, hsl(0 65% 50%) 0 0);"
                @click="pickerOpen = true">
                <Icon>palette</Icon>
            </button>
        </div>
        <BottomSheet v-model:active="pickerOpen" :handle=true>
            <template #content>
                <div class="color-maker">
                    <div class="hue-wheel" ref="hueWheel" @mouseup="hueWheelClick"
                        :style="{ 'background-image': `radial-gradient(var(--color-surface-container) 56%, transparent calc(56% + 1px)), conic-gradient(in hsl longer hue, hsl(0 ${value.s}% ${value.l}%) 0 0)` }">
                        <div class="hue-wheel-knob knob"
                            :style="{ 'transform': `rotate(${value.h - 6}deg)`, 'background-color': `hsl(${value.h} ${value.s}% ${value.l}%` }">
                        </div>
                        <div class="hue-wheel-example"
                            :style="{ 'background-color': `hsl(${value.h} ${value.s}% ${value.l}%` }">
                            {{ Number(value.h).toLocaleString('nl-NL', {
                                style: 'unit', unit: 'degree', unitDisplay: 'short',
                                maximumFractionDigits: 0
                            }) }}
                            <br>
                            {{ Number(value.s / 100).toLocaleString('nl-NL', {
                                style: 'percent',
                                maximumFractionDigits: 0
                            }) }}
                            <br>
                            {{ Number(value.l / 100).toLocaleString('nl-NL', {
                                style: 'percent',
                                maximumFractionDigits: 0
                            }) }}
                        </div>
                    </div>
                    <div class="col-right">
                        <div class="saturation-bar color-bar" ref="saturationBar" @mouseup="saturationBarClick"
                            :style="{ 'background-image': `linear-gradient(to left, hsl(${value.h} 100% ${value.l}%), hsl(${value.h} 50% ${value.l}%), hsl(${value.h} 0% ${value.l}%))` }">
                            <div class="saturation-bar-knob color-bar-knob knob"
                                :style="{ 'left': `${value.s}%`, 'background-color': `hsl(${value.h} ${value.s}% ${value.l}%` }">
                            </div>
                        </div>
                        <div class="luminance-bar color-bar" ref="luminanceBar" @mouseup="luminanceBarClick"
                            :style="{ 'background-image': `linear-gradient(to left, hsl(${value.h} ${value.s}% 100%), hsl(${value.h} ${value.s}% 50%), hsl(${value.h} ${value.s}% 0%))` }">
                            <div class="luminance-bar-knob color-bar-knob knob"
                                :style="{ 'left': `${value.l}%`, 'background-color': `hsl(${value.h} ${value.s}% ${value.l}%` }">
                            </div>
                        </div>
                        <button v-if="eyeDropperSupported" class="button tonal invoke-eyedropper" @click="invokeEyeDropper">
                            <Icon>colorize</Icon><span>Pipet</span>
                        </button>
                    </div>
                </div>
            </template>
        </BottomSheet>
    </div>
</template>

<style scoped>
.color-picker {
    margin-top: 8px;
}

.gallery {
    display: grid;
    grid-template-columns: 1fr 50px;
    align-items: stretch;
    justify-content: stretch;
    gap: 4px;
}

.swatches {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 2px;
    padding: 1px;

    /* border-radius: 16px; */
    /* overflow: hidden; */
}

.swatch {
    min-width: 20px;
    min-height: 20px;
    /* aspect-ratio: 1; */

    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--color-on-surface-variant);
    border: none;
    border-radius: 2px;
    cursor: pointer;
}

.swatch:nth-child(1) {
    border-top-left-radius: 4px;
}

.swatch:nth-child(4) {
    border-top-right-radius: 4px;
}

.swatch:nth-child(5) {
    border-bottom-left-radius: 4px;
}

.swatch:nth-child(8) {
    border-bottom-right-radius: 4px;
}

.swatch.selected {
    margin: -1px;
    outline: 2px solid var(--color-on-secondary-container);
    z-index: 2;
}

.custom {
    aspect-ratio: 1;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    color: var(--color-on-surface-container);
}

.color-maker {
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    gap: 30px;
}

.hue-wheel {
    position: relative;
    width: 200px;
    aspect-ratio: 1;
    border-radius: 50%;
    cursor: crosshair;
}

.knob {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 3px 0 var(--color-shadow);
    pointer-events: none;
}

.hue-wheel-knob {
    top: -1px;
    left: 50%;
    transform-origin: 0 100.5px;
}

.hue-wheel-example {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 65%;
    aspect-ratio: 1;
    translate: -50% -50%;

    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;

    color: #ffffff;
}

.col-right {
    flex: 1 1 0;

    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
    gap: 30px;
}

.color-bar {
    position: relative;
    height: 20px;
    cursor: crosshair;
    border-radius: 10px;
}

.color-bar-knob {
    top: 50%;
    translate: -50% -50%;
}

.invoke-eyedropper {
    width: max-content;
}
</style>