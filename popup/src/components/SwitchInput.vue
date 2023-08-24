<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { useElementSize, useFocus } from '@vueuse/core'

import Icon from './Icon.vue'

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])

const label = ref(null)
const { height } = useElementSize(label)

const input = ref(null)
const { focused } = useFocus(input)

const value = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})
</script>

<template>
    <label class="setting switch" :for="id" ref="label" :class="{ tall: height > 70, focused: focused }">
        <div>
            <h3 class="setting-title">
                <slot name="title"></slot>
            </h3>
            <span class="setting-subtitle">
                <slot name="subtitle"></slot>
            </span>
        </div>
        <div class="switch-track" :data-state="value">
            <div class="switch-thumb" :data-state="value">
                <Icon class="switch-icon" :data-state="value">check</Icon>
            </div>
        </div>
        <input type="checkbox" :id="id" ref="input" v-model="value">
    </label>
</template>

<style>
@property --thumb-size {
    syntax: "<length>";
    initial-value: 16px;
}

.setting.switch {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: center;
    cursor: pointer;
}

.setting.switch.tall {
    align-items: start;
}

.switch-track {
    --thumb-size: 16px;
    position: relative;
    box-sizing: border-box;
    width: 52px;
    height: 32px;
    padding: calc(-0.5 * var(--thumb-size) + 14px);
    background-color: var(--color-surface-container-highest);
    border-style: solid;
    border-color: var(--color-outline);
    border-width: 2px;
    border-radius: 16px;
    transition: background-color 200ms, border-color 200ms, padding 200ms, --thumb-size 200ms;
}

.switch-track[data-state=true] {
    --thumb-size: 24px;
    padding-left: calc(-0.5 * var(--thumb-size) + 34px);
    border-color: transparent;
    background-color: var(--color-primary);
}

label:hover .switch-track,
label:focus-visible .switch-track,
label.focused .switch-track,
.switch-track:active {
    --thumb-size: 28px;
}

.switch-thumb {
    position: absolute;
    width: var(--thumb-size);
    height: var(--thumb-size);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-outline);
    border-radius: calc(var(--thumb-size) / 2);
    transition: background-color 200ms, color 200ms, width 200ms, height 200ms, border-radius 200ms, --thumb-size 200ms;
}

.switch-thumb[data-state=true] {
    background-color: var(--color-on-primary);
}

.switch-icon {
    font-size: 16px;
    scale: 1.2;
    opacity: 0;
    color: var(--color-surface-container-highest);
    transition: opacity 200ms, color 200ms;
}

.switch-icon[data-state=true] {
    opacity: 1;
    color: var(--color-on-primary-container);
}

.switch input[type=checkbox] {
    position: absolute;
    height: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
}
</style>