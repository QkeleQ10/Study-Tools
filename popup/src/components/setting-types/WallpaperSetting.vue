<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { useFocus } from '@vueuse/core'
import Icon from '../Icon.vue';

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
    <div class="setting wallpaper-setting">
        <Icon class="setting-icon">wallpaper</Icon>
        <label class="text-label" :for="id" :class="{ focused: focused, filled: filled }">
            <input class="text-input" :type="setting.fieldType || 'input'" :id="id" ref="input" v-model="value"
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
    </div>
</template>

<style scoped>
.wallpaper-setting {
    display: grid;
    grid-template-columns: 26px 1fr;
    align-items: baseline;
    gap: 6px;
    column-gap: 12px;
}

.wallpaper-setting>.setting-icon {
    font-size: 18px;
    scale: 1.4;
    color: var(--color-on-surface-variant);
    justify-self: center;
}

.wallpaper-setting .text-label {
    position: relative;
    display: grid;
    grid-template-rows: 1fr auto;
    gap: 4px;
}

.wallpaper-setting .setting-title {
    position: absolute;
    left: 16px;
    top: 14px;
    color: var(--color-on-surface-variant);
    font: var(--typescale-body-large);
    pointer-events: none;
    transition: color 200ms, top 200ms, font 200ms;
}

.wallpaper-setting .focused .setting-title,
.wallpaper-setting .filled .setting-title {
    top: -10px;
    font-size: 12px;
    line-height: 16px;
}

.wallpaper-setting .focused .setting-title {
    color: var(--color-on-surface);
}

.wallpaper-setting .focused .setting-title {
    color: var(--color-primary);
}

.wallpaper-setting .border-cutout {
    position: absolute;
    top: -8px;
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
    transition: background-color 200ms, scale 200ms;
}

.wallpaper-setting .focused .border-cutout,
.wallpaper-setting .filled .border-cutout {
    scale: 1;
}

.wallpaper-setting .setting-subtitle {
    color: var(--color-on-surface-variant);
    font: var(--typescale-body-small);
    margin-left: 16px;
}

.wallpaper-setting .text-input {
    height: 52px;
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
    transition: background-color 200ms, color 200ms, outline-color 200ms;
}

.wallpaper-setting .text-input:enabled:hover {
    outline-color: var(--color-on-surface);
}

.wallpaper-setting .text-input:focus {
    outline-width: 2px;
    outline-color: var(--color-primary);
}
</style>