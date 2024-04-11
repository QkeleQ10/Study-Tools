<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import ColorWheel from '../sheets/ColorWheel.vue';

const props = defineProps(['modelValue', 'setting'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        return props.modelValue, props.setting.default
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

const pickerOpen = ref(false)

function updateColor(newColor) {
    value.value = { ...newColor }
}
</script>

<template>
    <div class="setting color-override-setting">
        <div>
            <h3 class="setting-title">
                <slot name="title"></slot>
            </h3>
            <span class="setting-subtitle">
                <slot name="subtitle"></slot>
            </span>
        </div>
        help ik weet niet hoe dit moet

        <ColorWheel class="color-override-custom" :model-value="value" @update:model-value="updateColor"
            v-bind:pickerOpen="pickerOpen" />
    </div>
</template>

<style scoped></style>