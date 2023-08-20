<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

import BottomSheet from './BottomSheet.vue'
import Icon from './Icon.vue'

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])
const value = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

let pickerOpen = ref(false)
</script>

<template>
    <div class="setting image-input" ref="label">
        <div class="image-input-click-layer" @click="pickerOpen = true">
            <div>
                <h3 class="setting-title">
                    <slot name="title"></slot>
                </h3>
                <span class="setting-subtitle">
                    <slot name="subtitle"></slot>
                </span>
            </div>
            <Icon>chevron_right</Icon>
        </div>
        <BottomSheet v-model:active="pickerOpen" :handle=true>
            <template #content>
                {{ value }}
            </template>
        </BottomSheet>
    </div>
</template>

<style>
.image-input-click-layer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-left: -16px;
    margin-right: -24px;
    margin-block: -12px;
    padding-left: 16px;
    padding-right: 24px;
    padding-block: 12px;
    cursor: pointer;
}

.image-input-selected {
    display: inline-block;
    width: auto;
    color: var(--color-on-surface);
    font: var(--typescale-headline-small);
    opacity: 40%;
    transition: opacity 200ms;
}

.image-input-selected.selected {
    opacity: 1;
    animation: lockInKey 200ms 2 alternate;
}

@keyframes lockInKey {
    to {
        scale: 1.3;
    }
}
</style>