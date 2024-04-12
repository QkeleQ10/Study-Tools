<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import ColorWheel from '../sheets/ColorWheel.vue';
import Icon from '../Icon.vue';
import SegmentedButton from '../inputs/SegmentedButton.vue';

const props = defineProps(['modelValue', 'setting'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        let v = props.modelValue || props.setting.default
        let [override, h, s, l] = v.split(',')
        return { override, color: { h, s, l } }
    },
    set(value) {
        emit('update:modelValue', `${value.override},${value.color.h},${value.color.s},${value.color.l}`)
    }
})

const pickerOpen = ref(false)

function updateOverride(newOverride) {
    value.value = { ...value.value, override: newOverride }
    if (newOverride == 'true') pickerOpen.value = true
}

function updateColor(newColor) {
    value.value = { ...value.value, color: newColor }
}

function updatePickerOpen(newPickerOpenValue) {
    pickerOpen.value = newPickerOpenValue
}
</script>

<template>
    <div class="setting color-override-setting" :title="setting.title">
        <h3 class="setting-title">
            {{ setting.subtitle }}
        </h3>
        <Icon class="setting-icon">format_color_fill</Icon>
        <SegmentedButton :model-value="value.override" @update:model-value="updateOverride" :options="[
            { value: 'false', icon: 'format_color_reset', title: 'Standaard' },
            { value: 'true', icon: 'palette', title: 'Aangepast' }
        ]" density="-1" />

        <ColorWheel :model-value="value.color" @update:model-value="updateColor" :pickerOpen="pickerOpen"
            @update:pickerOpen="updatePickerOpen" />
    </div>
</template>

<style scoped>
.color-override-setting {
    display: grid;
    grid-template-columns: 26px 1fr;
    grid-template-rows: auto auto;
    align-items: center;
    gap: 6px;
    column-gap: 12px;
}

.color-override-setting>.setting-icon {
    font-size: 18px;
    scale: 1.2;
    color: var(--color-on-surface-variant);
    justify-self: center;
}

.color-override-setting>h3.setting-title {
    grid-column: span 2;
}
</style>