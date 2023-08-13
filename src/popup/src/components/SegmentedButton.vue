<script setup>
import Icon from './Icon.vue';

/* eslint-disable */
import { computed } from 'vue'

const props = defineProps(['modelValue', 'id', 'options'])
const emit = defineEmits(['update:modelValue'])

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
    <div class="setting segmented-button">
        <label :for="id">
            <div>
                <h3 class="setting-title">
                    <slot name="title"></slot>
                </h3>
                <span class="setting-subtitle">
                    <slot name="subtitle"></slot>
                </span>
                <div class="button-wrapper">
                    <button v-for="option in options" class="button-segment" @click="value = option.value"
                        :data-state="option.value === value">
                        <Icon class="button-segment-icon" v-if="option.icon">{{ option.icon }}</Icon>
                        <span class="button-segment-text">{{ option.title }}</span>
                    </button>
                </div>
            </div>
        </label>
    </div>
</template>

<style>
.button-wrapper {
    display: flex;
    width: 100%;
}

.button-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex: 1 1 0px;
    height: 40px;
    min-width: 48px;
    padding-inline: 12px;
    margin-block: 4px;
    border: 1px solid var(--color-outline);
    border-right: none;
    cursor: pointer;
    background-color: transparent;
    transition: background-color 200ms;
}

.button-segment:first-of-type {
    border-top-left-radius: 20px;
    border-bottom-left-radius: 20px;
}

.button-segment:last-of-type {
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
    border-right: 1px solid var(--color-outline);
}

.button-segment[data-state=true] {
    background-color: var(--color-secondary-container);
}

.button-segment-icon {
    font-size: 18px;
    scale: 1.2;
    color: var(--color-on-surface);
    transition: color 200ms;
}

.button-segment[data-state=true] .button-segment-icon {
    color: var(--color-on-secondary-container);
}

.button-segment-text {
    font: var(--typescale-label-large);
    color: var(--color-on-surface);
    transition: color 200ms;
}

.button-segment[data-state=true] .button-segment-text {
    color: var(--color-on-secondary-container);
}
</style>