<script setup>
// eslint-disable-next-line
defineProps({
    filled: Boolean
})
</script>

<template>
    <span aria-hidden="true" class="icon material-symbols-outlined" :class="filled ? 'fill' : ''">
        <slot></slot>
    </span>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200");

.icon {
    -webkit-user-select: none;
    user-select: none;
    font-variation-settings: 'FILL' 0;
    transition: font-variation-settings 200ms ease-out;
}

.icon.fill {
    font-variation-settings: 'FILL' 1;
}
</style>