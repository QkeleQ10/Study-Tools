<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps(['active', 'handle'])
const emit = defineEmits(['update:active'])

const closeBottomSheet = () => {
    emit('update:active', false)
}
</script>

<template>
    <div class="scrim" :active="props.active" @click="closeBottomSheet"></div>
    <div class="bottom-sheet" :active="props.active">
        <div v-if="handle" class="bottom-sheet-handle" @click="closeBottomSheet"></div>
        <slot name="content"></slot>
    </div>
</template>

<style>
.bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    box-sizing: border-box;
    pointer-events: none;
    translate: 0 100vh;
    padding: 24px 24px 48px;
    border-radius: 28px 28px 0 0;
    z-index: 10001;
    background-color: var(--color-surface-container-low);
    transition: translate 200ms, background-color 200ms;
}

.bottom-sheet[active=true] {
    pointer-events: all;
    translate: 0 24px;
    transition: translate 300ms cubic-bezier(.29, 1.3, .64, 1), background-color 200ms;
}

.bottom-sheet-handle {
    position: relative;
    width: 100%;
    height: 48px;
    margin-top: -24px;
    cursor: pointer;
}

.bottom-sheet-handle:after {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    content: '';
    width: 32px;
    height: 4px;
    opacity: 40%;
    background-color: var(--color-on-surface-variant);
    border-radius: 2px;
}

.bottom-sheet-action {
    height: 56px;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
    padding-block: 8px;
    padding-left: 16px;
    padding-right: 24px;
    font: var(--typescale-body-large);
    color: var(--color-on-surface);
    background-color: transparent;
    border: none;
    cursor: pointer;
}

.bottom-sheet-action .icon {
    color: var(--color-on-surface-variant);
    font-size: 24px;
}

.supporting-text {
    display: block;
    font: var(--typescale-label-medium);
    color: var(--color-on-surface-variant);
}
</style>