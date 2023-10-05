<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps(['active', 'handle'])
const emit = defineEmits(['update:active'])

const sheetState = ref('hidden')

const closeBottomSheet = () => {
    sheetState.value = 'hiding'
    setTimeout(() => {
        emit('update:active', false)
        sheetState.value = 'hidden'
    }, 200)
}

watch(() => props.active, async (value) => {
    if (value === true) {
        sheetState.value = 'showing'
        setTimeout(() => {
            sheetState.value = 'shown'
        }, 300)
    } else {
        sheetState.value = 'hiding'
        setTimeout(() => {
            emit('update:active', false)
            sheetState.value = 'hidden'
        }, 200)
    }
})

</script>

<template>
    <div v-if="sheetState !== 'hidden'" class="scrim" :active="sheetState === 'shown' || sheetState === 'showing'"
        @click="closeBottomSheet"></div>
    <div v-if="sheetState !== 'hidden'" class="bottom-sheet" :data-visible="sheetState !== 'hidden'"
        :data-state="sheetState">
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
    translate: 0 24px;
    padding: 24px 24px 48px;
    border-radius: 28px 28px 0 0;
    z-index: 10001;
    background-color: var(--color-surface-container-low);
    transition: background-color 200ms;
}

.bottom-sheet[data-visible=false] {
    display: none;
    pointer-events: none;
}

.bottom-sheet[data-visible=true] {
    display: initial;
    pointer-events: all;
}

.bottom-sheet[data-state=showing] {
    animation-name: bottom-sheet-slide;
    animation-duration: 300ms;
    animation-timing-function: cubic-bezier(.29, 1.3, .64, 1);
    animation-fill-mode: both;
}

.bottom-sheet[data-state=hiding] {
    animation-name: bottom-sheet-slide;
    animation-duration: 200ms;
    animation-direction: reverse;
    animation-fill-mode: both;
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
    display: grid;
    grid-template-columns: auto 1fr auto;
    justify-content: start;
    align-items: center;
    gap: 16px;
    padding-block: 8px;
    padding-left: 16px;
    padding-right: 24px;
    font: var(--typescale-body-large);
    color: var(--color-on-surface);
    background-color: transparent;
    border: none;
    text-align: left;
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

@keyframes bottom-sheet-slide {
    from {
        translate: 0 100vh;
    }

    to {
        translate: 0 24px;
    }
}
</style>