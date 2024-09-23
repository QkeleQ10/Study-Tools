<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { useFocus } from '@vueuse/core'

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

const input = ref(null)
const { focused } = useFocus(input)

const filled = computed(() => {
    return value?.value?.length > 0
})
</script>

<template>
    <label class="setting text" :for="id" :class="{ focused: focused, filled: filled }">
        <input class="text-input" :type="setting.fieldType || 'input'" :id="id" ref="input" v-model.lazy="value"
            placeholder=" " autocomplete="off">
        <div class="border-cutout">
            <slot name="title"></slot>
        </div>
        <h3 class="setting-title">
            <slot name="title"></slot>
        </h3>
        <span class="setting-subtitle">
            <slot name="subtitle"></slot>
        </span>
    </label>
</template>

<style>
.setting.text {
    position: relative;
    display: grid;
    grid-template-rows: 1fr auto;
    gap: 4px;
}

.setting.text .setting-title {
    position: absolute;
    left: 16px;
    top: 28px;
    color: var(--color-on-surface-variant);
    font: var(--typescale-body-large);
    pointer-events: none;
    transition: color 200ms, top 200ms, font 200ms;
}

.setting.text.focused .setting-title,
.setting.text.filled .setting-title {
    top: 4px;
    font-size: 12px;
    line-height: 16px;
}

.setting.text.focused .setting-title {
    color: var(--color-on-surface);
}

.setting.text.focused .setting-title {
    color: var(--color-primary);
}

.setting.text .border-cutout {
    position: absolute;
    top: 6px;
    left: 12px;
    font: var(--typescale-body-large);
    font-size: 12px;
    line-height: 16px;
    padding-inline: 4px;
    background-color: var(--color-surface);
    color: transparent;
    border-radius: 4px;
    scale: 0 1;
    pointer-events: none;
    transition: scale 200ms;
}

.setting.text.focused .border-cutout,
.setting.text.filled .border-cutout {
    scale: 1;
}

.setting.text .setting-subtitle {
    color: var(--color-on-surface-variant);
    font: var(--typescale-body-small);
    margin-left: 16px;
}

.text-input {
    height: 56px;
    padding-inline: 16px;
    padding-block: 0;
    box-sizing: border-box;
    outline: 1px solid var(--color-outline);
    border: none;
    border-radius: 4px;
    background-color: transparent;
    caret-color: var(--color-primary);
    color: var(--color-on-surface);
    font: var(--typescale-body-large);
    transition: outline-color 200ms;
}

.text-input:enabled:hover {
    outline-color: var(--color-on-surface);
}

.text-input:focus {
    outline-width: 2px;
    outline-color: var(--color-primary);
}
</style>