<script setup>
function click() {
    chrome.windows.create({
        url: 'popup/dist/index.html?type=options&view=custom-css',
        type: 'popup',
        width: 1000,
        height: 800
    })
}
</script>

<template>
    <button @click="click">
        <div>
            <h3 class="setting-title">
                <slot name="title"></slot>...
            </h3>
        </div>
        <Icon>chevron_right</Icon>
    </button>
</template>

<style scoped>
button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 56px;
    padding-block: 12px;
    padding-inline: 0;
    background-color: transparent;
    border: none;
    border-bottom: 1px solid var(--color-surface-variant);
    color: var(--color-on-surface);
    cursor: pointer;
}
</style>