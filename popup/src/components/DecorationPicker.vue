<script setup>
import { computed, defineProps, defineEmits } from 'vue'

import Icon from './Icon.vue'

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])
const value = computed({
    get() {
        return props.modelValue || decorations[0].id
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

const decorations = [
    {
        id: 'none',
        name: "Geen",
        style: {}
    },
    {
        id: 'waves',
        name: "Golven",
        style: {
            'background-image': 'repeating-radial-gradient( circle at 0 0, transparent 0, var(--palette-primary) 19px, transparent 20px ), repeating-linear-gradient( #ffffff66, #ffffff88 )'
        }
    },
    {
        id: 'zig-zag',
        name: "Zigzag",
        style: {
            'background-image': 'linear-gradient(135deg, #ffffff66 25%, transparent 25%), linear-gradient(225deg, #ffffff66 25%, transparent 25%), linear-gradient(45deg, #ffffff66 25%, transparent 25%), linear-gradient(315deg, #ffffff66 25%, var(--palette-primary) 25%)',
            'background-position': '15px 0, 15px 0, 0 0, 0 0',
            'background-size': '30px 30px',
            'background-repeat': 'repeat'
        }
    },
    {
        id: 'polka-dot',
        name: "Stippen",
        style: {
            'background-image': 'radial-gradient(#ffffff66 30%, transparent 31.2%), radial-gradient(#ffffff66 30%, transparent 31.2%)', 'background-position': '0px 0px, 15px 15px', 'background-size': '30px 30px'
        }
    },
    {
        id: 'stripes',
        name: "Strepen",
        style: {
            'background-image': 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff66 10px, #ffffff66 20px)'
        }
    },
]
</script>

<template>
    <div class="setting decoration-picker">
        <div>
            <h3 class="setting-title">
                <slot name="title"></slot>
            </h3>
            <span class="setting-subtitle">
                <slot name="subtitle"></slot>
            </span>
        </div>
        <!--should the swatches have their own bottom-sheet for colour consistency?-->
        <div class="swatches-wrapper">
            <button v-for="(decoration, i) in decorations" :key="i" class="swatch" :style="decoration.style"
                :title="decoration.name" @click="value = decoration.id" :data-state="value === decoration.id">
                <Transition name="swatch-check">
                    <div v-if="value === decoration.id">
                        <div class="state-layer"></div>
                        <Icon>check</Icon>
                    </div>
                </Transition>
            </button>
        </div>
    </div>
</template>

<style scoped>
.setting.decoration-picker {
    display: grid;
    grid-template-rows: 1fr auto;
    gap: 6px;
}

.swatches-wrapper {
    display: flex;
    height: 40px;
    gap: 6px;
}

.swatch {
    position: relative;
    min-width: 40px;
    border: none;
    border-radius: 28px;
    cursor: pointer;
    outline: 1px solid var(--color-outline);
    overflow: hidden;
    transition: border-radius 200ms, flex-grow 200ms, background-color 200ms;
}

.setting.decoration-picker .swatch {
    color: #fff;
    background-color: var(--palette-primary);
}

.swatch:hover,
.swatch:focus-visible {
    border-radius: 10px;
}

.swatch .state-layer {
    position: absolute;
    inset: 0;
    background-color: var(--color-scrim);
    opacity: .3;
}

.swatch .icon {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    font-size: 24px;
    color: color-contrast(hsl(var(--h) calc(var(--s) * 1%) calc(var(--l) * 1%)) vs #fff, #000);
}

.swatch-check-enter-active,
.swatch-check-leave-active {
    transition: opacity 200ms, font-variation-settings 200ms;
}

.swatch-check-enter-from,
.swatch-check-leave-to {
    opacity: 0;
    font-variation-settings: 'WGHT' 0;
}
</style>