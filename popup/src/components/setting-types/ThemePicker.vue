<script setup>
import { computed, defineProps, defineEmits } from 'vue'

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])
const value = computed({
    get() {
        return props.modelValue || swatches[0].codepoint
    },
    set(value) {
        emit('update:modelValue', `${value.scheme},${value.color.h},${value.color.s},${value.color.l}`)
    }
})

const parsedValue = computed(() => {
    let [scheme, h, s, l] = value.value.split(',')
    console.log(value.value)
    return { scheme, color: { h, s, l } }
})

const swatches = [
    {
        scheme: 'light',
        color: { h: 207, s: 95, l: 55 },
        codepoint: 'light,207,95,55'
    },
    {
        scheme: 'dark',
        color: { h: 207, s: 95, l: 55 },
        codepoint: 'dark,207,95,55'
    }
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
        <div class="theme-picker-example" :style="{ 'background-color': `var(--mg-bk-${parsedValue.scheme}-1)` }">
            <div style="position: absolute; left: 0; top: 0; width: 25%; height: 100%"
                :style="{ 'background-color': `hsl(${parsedValue.color.h} ${parsedValue.color.s} ${parsedValue.color.l})` }">
            </div>
            <div
                style="position: absolute; left: 4%; top: 10%; width: 15%; height: 7%; border-radius: 100vmax; background-color: #fff; opacity: .5;">
            </div>
            <div style="position: absolute; left: 29%; top: 10%; width: 20%; height: 7%; border-radius: 100vmax;"
                :style="{ 'background-color': `hsl(${parsedValue.color.h} ${parsedValue.color.s} ${parsedValue.color.l})` }">
            </div>
            <div style="position: absolute; right: 0; top: 0; width: 30%; height: 100%"
                :style="{ 'background-color': `var(--mg-bk-${parsedValue.scheme}-2)` }"></div>
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
}
</style>