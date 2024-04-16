<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import BottomSheet from '../BottomSheet.vue';
import Icon from '../Icon.vue';
import { useEyeDropper, useMousePressed } from '@vueuse/core';

const props = defineProps(['modelValue', 'pickerOpen', 'swatches'])
const emit = defineEmits(['update:modelValue', 'update:pickerOpen'])

const value = computed({
    get() {
        if (typeof props.modelValue === 'string')
            return ({ h: props.modelValue.split()[0], s: props.modelValue.split()[1], l: props.modelValue.split()[2] })
        else
            return props.modelValue
    },
    set(value) {
        if (typeof props.modelValue === 'string')
            emit('update:modelValue', value.join(','))
        else
            emit('update:modelValue', value)
    }
})

const pickerOpen = computed({
    get() {
        return props.pickerOpen || false
    },
    set(value) {
        emit('update:pickerOpen', value)
    }
})

const hueWheel = ref(null),
    saturationBar = ref(null),
    luminanceBar = ref(null)
const hueWheelMouse = useMousePressed({ target: hueWheel }),
    saturationBarMouse = useMousePressed({ target: saturationBar }),
    luminanceBarMouse = useMousePressed({ target: luminanceBar })

const { isSupported: eyeDropperSupported, open: openEyeDropper, sRGBHex: eyeDropperHEX } = useEyeDropper()

function hueWheelClick(event) {
    if (event.type === 'mousemove' && !hueWheelMouse.pressed.value) return

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
    if (event.type === 'mousemove' && !saturationBarMouse.pressed.value) return

    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = (event.clientX - rect.left) / rect.width * 100
    value.value = { ...value.value, s: Math.floor(offsetX) }
}

function luminanceBarClick(event) {
    if (event.type === 'mousemove' && !luminanceBarMouse.pressed.value) return

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

function isSelected(color) {
    return (color.h == value.value.h && color.s == value.value.s && color.l == value.value.l)
}
</script>

<template>
    <BottomSheet v-model:active="pickerOpen" :handle=true>
        <template #content>
            <div class="color-maker">
                <div class="hue-wheel" ref="hueWheel" @mouseup="hueWheelClick" @mousemove="hueWheelClick"
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
                        @mousemove="saturationBarClick"
                        :style="{ 'background-image': `linear-gradient(to left, hsl(${value.h} 100% ${value.l}%), hsl(${value.h} 50% ${value.l}%), hsl(${value.h} 0% ${value.l}%))` }">
                        <div class="saturation-bar-knob color-bar-knob knob"
                            :style="{ 'left': `${value.s}%`, 'background-color': `hsl(${value.h} ${value.s}% ${value.l}%` }">
                        </div>
                    </div>
                    <div class="luminance-bar color-bar" ref="luminanceBar" @mouseup="luminanceBarClick"
                        @mousemove="luminanceBarClick"
                        :style="{ 'background-image': `linear-gradient(to left, hsl(${value.h} ${value.s}% 100%), hsl(${value.h} ${value.s}% 50%), hsl(${value.h} ${value.s}% 0%))` }">
                        <div class="luminance-bar-knob color-bar-knob knob"
                            :style="{ 'left': `${value.l}%`, 'background-color': `hsl(${value.h} ${value.s}% ${value.l}%` }">
                        </div>
                    </div>
                    <div v-if="swatches?.length > 0" class="swatches">
                        <button v-for="swatch in swatches" class="swatch"
                            :class="{ 'selected': isSelected(swatch.color) }" :key="swatch.name" :title="swatch.name"
                            :style="{ 'background-color': `hsl(${swatch.color.h} ${swatch.color.s}% ${swatch.color.l}%` }"
                            @click="value = swatch.color"></button>
                    </div>
                    <div class="flex">
                        <button class="button" @click="pickerOpen = false">
                            <span>Gereed</span>
                        </button>
                        <button v-if="eyeDropperSupported" class="button tonal invoke-eyedropper"
                            @click="invokeEyeDropper">
                            <Icon>colorize</Icon><span>Pipet</span>
                        </button>
                    </div>
                </div>
            </div>
        </template>
    </BottomSheet>
</template>

<style scoped>
.color-maker {
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    gap: 28px;
}

.hue-wheel {
    position: relative;
    width: 200px;
    height: 200px;
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
    box-sizing: border-box;
    translate: -50% -50%;
    padding-left: 25%;

    display: flex;
    align-items: center;
    border-radius: 50%;

    color: #ffffff;
    font: var(--typescale-body-medium)
}

.col-right {
    flex: 1 1 0;

    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
    gap: 28px;
    padding-top: 30px;
}

.col-right:has(.swatches) {
    padding-top: 10px;
}

.flex {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    width: 100%;
    margin-top: auto;
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

.swatches {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 3px;
    margin-top: auto;
}

.swatch {
    min-width: 20px;
    min-height: 20px;

    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--color-on-surface-variant);
    outline: 0px solid var(--color-on-secondary-container);
    border: none;
    border-radius: 2px;
    cursor: pointer;
    transition: margin 50ms, outline 50ms;
}

.swatch:first-child {
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
}

.swatch:last-child {
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
}

.swatch.selected {
    margin: -1px;
    outline: 2px solid var(--color-on-secondary-container);
    z-index: 2;
}
</style>