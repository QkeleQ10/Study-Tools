<script setup>
import { ref } from 'vue';

import Icon from './Icon.vue';

const tabs = [
    {
        id: 'appearance',
        name: 'Uiterlijk',
        icon: 'format_paint'
    },
    {
        id: 'login',
        name: 'Inloggen',
        icon: 'key'
    },
    {
        id: 'functions',
        name: 'Functies',
        icon: 'widgets'
    },
    {
        id: 'data',
        name: 'Waarden',
        icon: 'dataset'
    },
    {
        id: 'about',
        name: 'Over',
        icon: 'info'
    }
]

let selectedTab = ref('appearance')
</script>

<template>
    <div id="navigation-bar">
        <div v-for="item in tabs" :key="item.id" class="navigation-item" @click="selectedTab = item.id" :active="item.id === selectedTab">
            <div class="navigation-item-icon-wrapper" :active="item.id === selectedTab">
                <Icon :filled="item.id === selectedTab">{{ item.icon }}</Icon>
            </div>
            <span>{{ item.name }}</span>
        </div>
    </div>
</template>

<style>
#navigation-bar {
    position: fixed;
    bottom: 0;
    width: 100%;
    /* height: 80px; */
    padding-top: 12px;
    padding-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: stretch;
    gap: 8px;
    background-color: var(--color-surface-container);
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