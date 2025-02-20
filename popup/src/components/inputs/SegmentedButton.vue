<script setup>
import { computed } from 'vue';
import Icon from '../Icon.vue';

const props = defineProps(['modelValue', 'options', 'density'])
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
    <div class="segmented-button">
        <button v-for="option in options" :key="option.value" class="button-segment" @click="value = option.value"
            :data-state="option.value === value" :data-has-icon="!!option.icon" :title="option.tooltip"
            :style="{ 'height': `${40 + (4 * (density || 0))}px` }">
            <div class="button-segment-icon-wrapper"
                :class="{ 'hidden': !(option.value === value || (option.icon && option.title)) }">
                <Transition name="icon">
                    <Icon key="selected" v-if="option.value === value" class="button-segment-icon selected">check
                    </Icon>
                    <Icon key="icon" v-else-if="option.icon && option.title" class="button-segment-icon">{{ option.icon }}
                    </Icon>
                </Transition>
            </div>
            <span v-if="option.title" class="button-segment-text">{{ option.title }}</span>
            <div v-else-if="option.icon" class="button-segment-icon-wrapper last">
                <Icon key="icon" class="button-segment-icon">{{ option.icon }}
                </Icon>
            </div>
            <div class="button-segment-state-layer"></div>
        </button>
    </div>
</template>

<style scoped>
.segmented-button {
    display: flex;
    box-sizing: border-box;
}

.button-segment {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
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

.button-segment-icon-wrapper {
    position: relative;
    width: 18px;
    height: 18px;
    margin-right: 8px;
    transition: margin-right 200ms;
}

.button-segment-icon-wrapper.last {
    margin-right: 0;
}

.button-segment-icon-wrapper.hidden {
    margin-right: -18px;
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
    transition: color 200ms;
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