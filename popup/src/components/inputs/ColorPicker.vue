<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import ColorWheelSheet from '../sheets/ColorWheelSheet.vue';
import Icon from '../Icon.vue'

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
    { name: "Bloedrood", color: { h: 10, s: 51, l: 41 } }, // red
    { name: "Rozerood", color: { h: 341, s: 61, l: 41 } }, // pink
    { name: "Lavendelpaars", color: { h: 290, s: 41, l: 41 } }, // purple
    { name: "Bosbespaars", color: { h: 240, s: 41, l: 41 } }, // indigo
]

function isSelected(color) {
    return (color.h == value.value.h && color.s == value.value.s && color.l == value.value.l)
}

const isAnySwatchSelected = computed(() => swatches.some(swatch => isSelected(swatch.color)))

function updateColor(newColor) {
    value.value = newColor
}

function updatePickerOpen(newPickerOpenValue) {
    pickerOpen.value = newPickerOpenValue
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
            <button class="custom" :class="{ 'selected': !isAnySwatchSelected }"
                :style="{ '--sel-color': !isAnySwatchSelected ? `hsl(${value.h} ${value.s}% ${value.l}%)` : 'transparent' }"
                title="Kleur kiezen" @click="pickerOpen = true">
                <!-- style="background-image: radial-gradient(var(--color-surface-container) 66%, transparent calc(66% + 2px)), conic-gradient(in hsl longer hue, hsl(0 65% 50%) 0 0);" -->
                <Icon>palette</Icon>
            </button>
        </div>

        <ColorWheelSheet :swatches="swatches" :model-value="value" @update:model-value="updateColor"
            :pickerOpen="pickerOpen" @update:pickerOpen="updatePickerOpen" />
    </div>
</template>

<style scoped>
.color-picker {
    margin-top: 8px;
}

.gallery {
    display: grid;
    grid-template-columns: 1fr 48px;
    align-items: stretch;
    justify-content: stretch;
    gap: 3px;
}

.swatches {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 3px;
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

.swatch:nth-child(1) {
    border-top-left-radius: 6px;
}

.swatch:nth-child(5) {
    border-bottom-left-radius: 6px;
}

.swatch.selected {
    margin: -1px;
    outline: 2px solid var(--color-on-secondary-container);
    z-index: 2;
}

.custom {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 48px;
    padding: 0;
    padding-right: 1px;
    background-color: transparent;
    border-radius: 4px;
    border-top-right-radius: 12px;
    border-bottom-right-radius: 12px;
    border: 1px solid var(--color-outline);
    cursor: pointer;
    font-size: 18px;
    color: var(--color-on-surface);
}

.custom.selected {
    background-color: var(--sel-color);
    color: #fff;
    /* color: color-contrast(var(--sel-color) vs #000, #fff); */
    border: none;
    outline: 2px solid var(--color-on-secondary-container);
    z-index: 2;
}
</style>