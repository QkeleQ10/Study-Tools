<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import BottomSheet from '../BottomSheet.vue';

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

const pickerOpen = ref(false)

const swatches = [
    { name: "Azuurblauw", color: { h: 207, s: 95, l: 55 } }, // default blue
    { name: "Zeegroen", color: { h: 161, s: 51, l: 41 } }, // green
    { name: "Mosgroen", color: { h: 90, s: 41, l: 41 } }, // lime
    { name: "Oranjegeel", color: { h: 40, s: 51, l: 41 } }, // yellow
    { name: "Bloedrood", color: { h: 1, s: 51, l: 41 } }, // red
    { name: "Rozerood", color: { h: 341, s: 61, l: 41 } }, // pink
    { name: "Lavendelpaars", color: { h: 290, s: 41, l: 41 } }, // purple
    { name: "Bosbespaars", color: { h: 240, s: 41, l: 41 } }, // indigo
]
// const supportsEyeDropper = window.EyeDropper

// function eyeDropper() {
//     // eslint-disable-next-line
//     const eyeDropper = new EyeDropper()

//     eyeDropper
//         .open()
//         .then((result) => {
//             value.value = result.sRGBHex
//         })
// }
</script>

<template>
    <div class="color-picker">
        <div class="swatches">
            <button v-for="swatch in swatches" class="swatch" :key="swatch.name" :title="swatch.name"
                :style="{ 'background-color': `hsl(${swatch.color.h} ${swatch.color.s}% ${swatch.color.l}%` }"
                @click="value = swatch.color"></button>
            <button class="custom"
                style="background-image: radial-gradient(var(--color-surface-container) 56%, transparent calc(56% + 2px)), conic-gradient(in hsl longer hue, hsl(0 75% 50%) 0 0);"
                @click="pickerOpen = true"></button>
        </div>
        <BottomSheet v-model:active="pickerOpen" :handle=true>
            <template #content>
                <div class="color-wheel"
                    style="background-image: radial-gradient(var(--color-surface-container) 56%, transparent calc(56% + 2px)), conic-gradient(in hsl longer hue, hsl(0 75% 50%) 0 0);">
                </div>
            </template>
        </BottomSheet>
    </div>
</template>

<style scoped>
.color-picker {
    margin-block: 4px;
}

.swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.swatches>button {
    min-width: 30px;
    min-height: 30px;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1px solid var(--color-outline-variant);
    flex: 1 1 18%;
}

.color-wheel {
    width: 50%;
    max-height: 20%;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1px solid var(--color-outline-variant);
}
</style>