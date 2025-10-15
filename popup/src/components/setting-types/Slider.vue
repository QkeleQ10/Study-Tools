<script setup>
import { computed, inject } from 'vue'

import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/material.css'

const props = defineProps(['modelValue', 'id', 'setting'])
const emit = defineEmits(['update:modelValue'])

const syncedStorage = inject('syncedStorage');

const value = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

function formatValue(val) {
    let decimals = props.setting.decimals || 0
    if (!props.setting.format) return Number(val).toLocaleString('nl-NL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

    switch (props.setting.format) {
        case 'percent':
            return Number(val).toLocaleString('nl-NL', { style: 'percent', minimumFractionDigits: decimals, maximumFractionDigits: decimals })

        default:
            return Number(val).toLocaleString('nl-NL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + props.setting.format
    }
}
</script>

<template>
    <div class="setting inline-slider" :title="setting.title" v-if="setting.display === 'inline'">
        <Icon class="setting-icon">{{ setting.icon }}</Icon>
        <VueSlider :min="setting.min" :max="setting.max" :interval="setting.step" :duration="0.2"
            :tooltip-formatter="val => formatValue(val)" :tooltip-style="{}" v-model.lazy="value" />
    </div>
    <div class="setting slider" v-else>
        <div>
            <h3 class="setting-title">
                <slot name="title"></slot>
            </h3>
            <span class="setting-subtitle">
                <slot name="subtitle"></slot>
            </span>
        </div>
        <VueSlider
            :min="typeof setting.min === 'string' ? syncedStorage[setting.min] : setting.min"
            :max="typeof setting.max === 'string' ? syncedStorage[setting.max] : setting.max"
            :interval="setting.step"
            :duration="0.2"
            :tooltip-formatter="val => formatValue(val)"
            :tooltip-style="{}"
            v-model.lazy="value"
        />
        </div>
</template>

<style>
.setting.slider {
    display: grid;
    grid-template-rows: 1fr auto;
    gap: 6px;
}

.setting.inline-slider {
    display: grid;
    grid-template-columns: 26px 1fr;
    align-items: center;
    gap: 6px;
    column-gap: 12px;
    padding-top: 0;
}

.setting.inline-slider>.setting-icon {
    font-size: 18px;
    scale: 1.4;
    color: var(--color-on-surface-variant);
    justify-self: center;
}

.vue-slider {
    width: calc(100% - 16px) !important;
    padding-inline: 8px !important;
    overflow: visible !important;
}

.vue-slider-dot {
    width: 20px !important;
    height: 20px !important;
}

.vue-slider-process,
.vue-slider-dot-handle,
.vue-slider-dot-tooltip-inner {
    background-color: var(--color-primary);
}

.vue-slider-rail {
    background-color: var(--color-surface-container-highest);
}

.vue-slider-dot-handle::after {
    display: none;
}

.vue-slider-dot-tooltip-text {
    font: var(--typescale-label-medium);
    color: var(--color-on-primary);
}
</style>