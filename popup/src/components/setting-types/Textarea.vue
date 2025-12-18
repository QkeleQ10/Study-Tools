<script setup>
import { ref, computed } from 'vue'
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

const textarea = ref(null)
const { focused } = useFocus(textarea)

const filled = computed(() => {
    return value?.value?.length > 0
})
</script>

<template>
    <label class="setting textarea" :for="id" :class="{ focused: focused, filled: filled }">
        <textarea class="textarea-input" :id="id" ref="textarea" v-model.lazy="value"
            placeholder=" " autocomplete="off"></textarea>
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
.setting.textarea {
    position: relative;
    display: grid;
    grid-template-rows: auto auto;
    gap: 4px;
}

.setting.textarea .setting-title {
    position: absolute;
    left: 16px;
    top: 16px;
    color: var(--color-on-surface-variant);
    font: var(--typescale-body-large);
    pointer-events: none;
    transition: color 200ms, top 200ms, font 200ms;
}

.setting.textarea.focused .setting-title,
.setting.textarea.filled .setting-title {
    top: 4px;
    font-size: 12px;
    line-height: 16px;
}

.setting.textarea.focused .setting-title {
    color: var(--color-primary);
}

.setting.textarea .border-cutout {
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

.setting.textarea.focused .border-cutout,
.setting.textarea.filled .border-cutout {
    scale: 1;
}

.setting.textarea .setting-subtitle {
    color: var(--color-on-surface-variant);
    font: var(--typescale-body-small);
    margin-left: 16px;
    margin-bottom: 8px;
}

.textarea-input {
    min-height: 120px;
    max-height: 300px;
    padding: 16px;
    box-sizing: border-box;
    outline: 1px solid var(--color-outline);
    border: none;
    border-radius: 4px;
    background-color: transparent;
    caret-color: var(--color-primary);
    color: var(--color-on-surface);
    font: var(--typescale-body-large);
    resize: vertical;
    transition: outline-color 200ms;
    font-family: inherit;
}

.textarea-input:enabled:hover {
    outline-color: var(--color-on-surface);
}

.textarea-input:focus {
    outline-width: 2px;
    outline-color: var(--color-primary);
}
</style>