<script setup>
</script>

<template>
    <header id="top-app-bar">
        <h1 id="app-heading">Study Tools</h1>
    </header>
</template>

<style>
header#top-app-bar {
    position: fixed;
    width: 100%;
    background-color: var(--color-surface);
    height: 64px;
    padding-inline: 16px;
    display: flex;
    align-items: center;
    transition: background-color 200ms;
}

header#top-app-bar[data-scrolled=true] {
    background-color: var(--color-surface-container);
}

h1#app-heading {
    font: var(--typescale-title-large);
    color: var(--color-on-surface);
    margin: 0;
}

h1#app-heading:after {
    content: '.';
    color: var(--mg-orange);
}
</style>