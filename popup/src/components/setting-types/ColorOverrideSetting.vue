<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import ColorWheel from '../sheets/ColorWheel.vue';
import Icon from '../Icon.vue';
import SegmentedButton from '../inputs/SegmentedButton.vue';

const props = defineProps(['modelValue', 'setting'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        return props.modelValue, props.setting.default
    },
    set(value) {
        console.log(value)
        emit('update:modelValue', value)
    }
})

const pickerOpen = ref(false)

function updateValue(newValue) {
    value.value = newValue
    if (newValue !== 'inherit') pickerOpen.value = true
}

function updateColor(newColor) {
    console.log(newColor, Object.values(newColor).join(','), value.value)
    value.value = Object.values(newColor).join(',')
}
</script>

<template>
    <div class="setting color-override-setting">
        <h3 class="setting-title">
            {{ setting.subtitle }}
        </h3>
        <Icon class="setting-icon">format_color_fill</Icon>
        <SegmentedButton :model-value="value" @update:model-value="updateValue" :options="[
                { value: 'inherit', icon: 'brightness_auto', title: 'Automatisch' },
                { value: value === 'inherit' ? '207,95,55' : value, icon: 'palette', title: 'Aangepast' }
            ]" />

        <ColorWheel :model-value="value === 'inherit'
                ? { h: 207, s: 95, l: 55 }
                : (([h, s, l]) => ({ h, s, l }))(value.split`,`.map(Number))" @update:model-value="updateColor"
            v-bind:pickerOpen="pickerOpen" />
    </div>
</template>

<style scoped>
.color-override-setting {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    align-items: center;
    row-gap: 6px;
    column-gap: 6px;
}

.color-override-setting>.setting-icon {
    font-size: 18px;
    scale: 1.2;
    color: var(--color-on-surface-variant);
    margin: 6px;
}

.color-override-setting>h3.setting-title {
    grid-column: span 2;
}
</style>