<script setup>
import { computed, defineProps, defineEmits } from 'vue'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        return props.modelValue || colorPresets[0].color
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

const colorPresets = [
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
        color picker
        {{ value }}
    </div>
</template>

<style>
.color-picker {
    background-color: red;
}
</style>