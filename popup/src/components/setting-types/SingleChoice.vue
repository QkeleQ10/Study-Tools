<script setup>
import { computed } from 'vue'

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
</script>

<template>
    <div class="setting segmented-button">
        <div>
            <h3 class="setting-title">
                <slot name="title"></slot>
            </h3>
            <span class="setting-subtitle">
                <slot name="subtitle"></slot>
            </span>
        </div>
        <div class="button-wrapper">
            <button v-for="option in setting.options" :key="option.value" class="button-segment"
                @click="value = option.value" :data-state="option.value === value" :data-has-icon="!!option.icon">
                <div class="button-segment-icon-wrapper">
                    <Transition name="icon">
                        <Icon key="selected" v-if="option.value === value" class="button-segment-icon selected">check
                        </Icon>
                        <Icon key="icon" v-else-if="option.icon" class="button-segment-icon">{{ option.icon }}
                        </Icon>
                    </Transition>
                </div>
                <span class="button-segment-text"
                    :style="{ 'margin-left': (option.value === value || option.icon) ? '0' : '-8px' }">{{ option.title
                    }}</span>
                <div class="button-segment-state-layer"></div>
            </button>
        </div>
    </div>
</template>

<style scoped>
.setting.segmented-button {
    display: grid;
    grid-template-rows: 1fr auto;
    gap: 6px;
}

.button-wrapper {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    box-sizing: border-box;
}

.button-segment {
    position: relative;
    display: grid;
    align-items: center;
    justify-content: center;
    grid-template-columns: 0px auto;
    gap: 8px;
    flex: 1 1 0px;
    height: 40px;
    min-width: 48px;
    padding-inline: 12px;
    margin-block: 4px;
    background-color: transparent;
    border: 1px solid var(--color-outline);
    border-right: none;
    outline: none;
    cursor: pointer;
    overflow: hidden;
    transition: grid-template-columns 200ms;
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

.button-segment[data-has-icon=true],
.button-segment[data-state=true] {
    grid-template-columns: 18px auto;
}

.button-segment-icon-wrapper {
    position: relative;
    width: 18px;
    height: 18px;
}

.button-segment-icon {
    position: absolute;
    top: 0;
    left: 0;
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
    margin-left: 0;
    transition: color 200ms, margin-left 200ms;
}

.button-segment[data-state=true] .button-segment-text {
    color: var(--color-on-secondary-container);
}

.button-segment-state-layer {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--color-on-surface);
    opacity: 0;
    transition: opacity 200ms;
}

.button-segment[data-state=true] .button-segment-state-layer {
    background-color: var(--color-on-secondary-container);
}

.button-segment:hover .button-segment-state-layer {
    opacity: 0.08;
}

.button-segment:focus-visible .button-segment-state-layer {
    opacity: 0.12;
    transition-duration: 0ms;
}

.button-segment:active .button-segment-state-layer {
    opacity: 0.12;
}

.icon-enter-active,
.icon-leave-active {
    transition: opacity 100ms, font-variation-settings 200ms;
}

.icon-enter-from,
.icon-leave-to {
    opacity: 0;
    font-variation-settings: 'wght' 0;
}
</style>