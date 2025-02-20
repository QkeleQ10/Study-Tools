<script setup>
import Icon from './Icon.vue';

const props = defineProps(['type'])
</script>

<template>
    <button class="chip" :class="props.type || 'assist'">
        <Icon class="chip-icon">
            <slot name=icon></slot>
        </Icon>
        <span class="chip-label">
            <slot name="label"></slot>
        </span>
        <div class="state-layer chip-state-layer"></div>
    </button>
</template>

<style>
.chip {
    position: relative;
    height: 32px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding-inline: 16px;
    border: 1px solid var(--color-outline);
    border-radius: 8px;
    background-color: transparent;
    cursor: pointer;
}

.chip:focus-visible {
    border-color: var(--color-on-surface);
    outline: none;
}

.chip-icon {
    color: var(--color-primary);
    margin-left: -8px;
}

.chip-label {
    color: var(--color-on-surface);
    font: var(--typescale-label-large);
}

.chip-state-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background-color: var(--color-on-surface);
    opacity: 0%;
    transition: opacity 200ms;
}

.chip:hover .chip-state-layer {
    opacity: 8%;
}

.chip:focus-visible .chip-state-layer {
    opacity: 12%;
    transition-duration: 0ms;
}

.chip:active .chip-state-layer {
    opacity: 12%;
}
</style>