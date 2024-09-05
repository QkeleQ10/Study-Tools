<script setup>
import { computed, defineProps, defineEmits } from 'vue'

import Icon from './Icon.vue'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue', 'scrollToTop'])

const value = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

const tabs = [
    {
        id: 'theme',
        name: 'Thema',
        icon: 'format_paint'
    },
    {
        id: 'login',
        name: 'Inloggen',
        icon: 'key'
    },
    {
        id: 'enhancements',
        name: 'Verbeteringen',
        icon: 'handyman'
    },
    {
        id: 'overlay',
        name: 'Overlay',
        icon: 'layers'
    },
    {
        id: 'about',
        name: 'Over',
        icon: 'info'
    }
]

function navClick(id) {
    let change = (value.value !== id)
    value.value = id
    emit('scrollToTop', change)
}
</script>

<template>
    <nav id="navigation-bar">
        <button v-for="item in tabs" :key="item.id" class="navigation-item" @click="navClick(item.id)"
            :active="item.id === value">
            <div class="navigation-item-icon-wrapper" :active="item.id === value">
                <Icon :filled="item.id === value">{{ item.icon }}</Icon>
            </div>
            <span>{{ item.name }}</span>
        </button>
    </nav>
</template>

<style>
#navigation-bar {
    width: 100%;
    box-sizing: border-box;
    padding-top: 12px;
    padding-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: stretch;
    gap: 8px;
    z-index: 9999;
    background-color: var(--color-surface-container);
    transition: background-color 200ms;
}

.navigation-item {
    display: flex;
    flex-direction: column;
    place-items: center;
    place-content: center;
    flex: 1 1 0px;
    gap: 4px;
    min-width: 48px;
    color: var(--color-on-surface);
    font: var(--typescale-label-medium);
    border: none;
    background-color: transparent;
    cursor: pointer;
}

.navigation-item[active=true] {
    color: var(--color-on-surface-variant);
}

.navigation-item-icon-wrapper {
    display: flex;
    place-items: center;
    place-content: center;
    width: 32px;
    height: 32px;
    border-radius: 16px;
    transition: background-color 200ms, width 200ms;
}

.navigation-item-icon-wrapper[active=true] {
    width: 64px;
    background-color: var(--color-secondary-container);
}

.navigation-item .icon {
    color: var(--color-on-secondary-container);
    font-size: 24px;
}
</style>