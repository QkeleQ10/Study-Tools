<script setup>
import { computed } from 'vue'

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
        id: 'sidebar',
        name: 'Menubalk',
        icon: 'thumbnail_bar'
    },
    {
        id: 'start',
        name: 'Start',
        icon: 'home'
    },
    {
        id: 'grades',
        name: 'Cijfers',
        icon: 'workspace_premium'
    },
    {
        id: 'studyguide',
        name: 'ELO',
        icon: 'local_library'
    },
{
        id: 'store',
        name: 'Store',
        icon: 'store'
    },
    {
        id: 'about',
        name: 'Over',
        icon: 'info'
    }
]

function navClick(id) {
    const change = (value.value !== id)
    value.value = id
    emit('scrollToTop', change)
}
</script>

<template>
    <nav id="navigation-rail">
        <button v-for="item in tabs" :key="item.id" class="navigation-item" @click="navClick(item.id)"
            :active="item.id === value">
            <div class="navigation-item-icon-wrapper" :active="item.id === value">
                <Icon :filled="item.id === value" :active="item.id === value">{{ item.icon }}</Icon>
            </div>
            <div class="navigation-item-state-layer"></div>
            <span>{{ item.name }}</span>
        </button>
    </nav>
</template>

<style>
#navigation-rail {
    grid-area: rail;
    width: 80px;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border-right: 1px solid transparent;
    background-color: var(--color-surface);
}

.navigation-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    height: max-content;
    min-height: 56px;
    width: 100%;
    padding-block: 0;
    padding-inline: 12px;
    color: var(--color-on-surface);
    font: var(--typescale-label-medium);
    border: none;
    outline: none;
    background-color: transparent;
    cursor: pointer;
}

.navigation-item[active=true] {
    color: var(--color-on-surface-variant);
}

.navigation-item:hover,
.navigation-item:hover .icon {
    color: var(--color-on-surface);
}

.navigation-item-icon-wrapper {
    display: flex;
    place-items: center;
    place-content: center;
    width: 32px;
    height: 32px;
    border-radius: 16px;
    transition: background-color 200ms, width 100ms;
}

.navigation-item-icon-wrapper[active=true] {
    width: 56px;
    background-color: var(--color-secondary-container);
}

.navigation-item .icon {
    color: var(--color-on-secondary-container);
    font-size: 24px;
}

.navigation-item[active=true] .icon {
    color: var(--color-on-surface-variant);
}

.navigation-item-state-layer {
    position: absolute;
    top: 0;
    width: 56px;
    height: 32px;
    border-radius: 16px;
    background-color: var(--color-on-surface);
    opacity: 0;
    transition: opacity 200ms;
}

.navigation-item:hover .navigation-item-state-layer {
    opacity: 0.08;
}

.navigation-item:focus-visible .navigation-item-state-layer {
    opacity: 0.12;
    transition-duration: 0ms;
}

.navigation-item:active .navigation-item-state-layer {
    opacity: 0.12;
}
</style>