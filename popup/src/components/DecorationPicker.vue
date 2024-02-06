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
            'background-image': 'repeating-radial-gradient( circle at 0 0, transparent 0, var(--palette-primary) 20px ), repeating-linear-gradient( #ffffff66, #ffffff88 )'
        }
    },
    {
        id: 'zig-zag',
        name: "Zigzag",
        style: {
            'background-image': 'linear-gradient(135deg, #ffffff66 25%, transparent 25%), linear-gradient(225deg, #ffffff66 25%, transparent 25%), linear-gradient(45deg, #ffffff66 25%, transparent 25%), linear-gradient(315deg, #ffffff66 25%, var(--palette-primary) 25%)',
            'background-position': '25px 0, 25px 0, 0 0, 0 0',
            'background-size': '50px 50px; background-repeat: repeat'
        }
    },
    {
        id: 'polka-dot',
        name: "Grote stippen",
        style: {
            'background-image': 'radial-gradient(#ffffff66 30%, transparent 31.2%), radial-gradient(#ffffff66 30%, transparent 31.2%)', 'background-position': '0px 0px, 52px 52px', 'background-size': '104px 104px'
        }
    },
    {
        id: 'stripes',
        name: "Grote strepen",
        style: {
            'background-image': 'repeating-linear-gradient(45deg, transparent, transparent 30px, #ffffff66 30px, #ffffff66 60px)'
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
                    <Icon v-if="value === decoration.id">check</Icon>
                </Transition>
            </button>
        </div>
    </div>
</template>

<style>
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

.swatches-wrapper>* {
    flex-grow: 1;
    border: none;
    border-radius: 28px;
    cursor: pointer;
    transition: border-radius 200ms, flex-grow 200ms, background-color 200ms;
}

.setting.decoration-picker .swatch {
    color: #fff;
    background-color: var(--palette-primary);
}

.swatches-wrapper>*[data-state=true] {
    flex-grow: 3;
}

.swatches-wrapper>*:hover,
.swatches-wrapper>*:focus-visible {
    border-radius: 10px;
}

.swatches-wrapper>* .icon {
    width: 0;
    translate: -12px;
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

.setting-wrapper[data-setting-id="decoration-size"] {
    border-top: none !important;
    margin-top: -12px;
}

.setting-wrapper[data-setting-id="decoration-size"] .setting-title {
    display: none;
}
</style>