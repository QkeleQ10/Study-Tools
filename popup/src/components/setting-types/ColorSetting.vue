<script setup>
import { computed } from 'vue';

import ColorPicker from '../inputs/ColorPicker.vue'

const props = defineProps(['modelValue', 'id', 'setting'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

function updateColor(newColor) {
    value.value = { ...newColor }
}
</script>


<template>
    <div class="setting color-picker">

        <div class="color-picker-title">
            <h3 class="setting-title">
                <slot name="title"></slot>
            </h3>
            <span class="setting-subtitle">
                <slot name="subtitle"></slot>
            </span>
        </div>

        <ColorPicker class="color-picker-color" :model-value="value" @update:model-value="updateColor" />

    </div>
</template>

<style scoped></style>