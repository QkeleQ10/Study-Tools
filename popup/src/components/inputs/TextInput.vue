<script setup>
import { ref, computed } from 'vue'
import { useFocus } from '@vueuse/core'

const model = defineModel()

const input = ref(null)
const { focused } = useFocus(input)
const filled = computed(() => {
    return model.value.length > 0
})
</script>

<template>
    <label class="text-label" :class="{ focused, filled }">
        <input class="text-input" type="input" ref="input" v-model="model" placeholder=" " autocomplete="off">
        <div class="border-cutout">
            <slot name="title"></slot>
        </div>
        <h3 class="text-title">
            <slot name="title"></slot>
        </h3>
    </label>
</template>

<style scoped>
.text-label {
    --context-color: var(--color-surface);
    position: relative;
    display: grid;
}

.text-label .text-title {
    position: absolute;
    left: 16px;
    top: 16px;
    margin: 0;
    color: var(--color-on-surface-variant);
    font: var(--typescale-body-large);
    pointer-events: none;
    transition: color 200ms, top 200ms, font 200ms;
}

.text-label.focused .text-title,
.text-label.filled .text-title {
    top: -8px;
    font-size: 12px;
    line-height: 16px;
}

.text-label.focused .text-title {
    color: var(--color-on-surface);
}

.text-label.focused .text-title {
    color: var(--color-primary);
}

.text-label .border-cutout {
    position: absolute;
    top: -9px;
    left: 12px;
    font: var(--typescale-body-large);
    font-size: 12px;
    line-height: 16px;
    padding-inline: 4px;
    background-color: var(--context-color);
    color: transparent;
    border-radius: 4px;
    scale: 0 1;
    pointer-events: none;
    transition: scale 200ms;
}

.text-label.focused .border-cutout,
.text-label.filled .border-cutout {
    scale: 1;
}

.text-input {
    height: 56px;
    padding-inline: 16px;
    padding-block: 0;
    box-sizing: border-box;
    outline: 1px solid var(--color-outline);
    border: none;
    border-radius: 4px;
    background-color: transparent;
    caret-color: var(--color-primary);
    color: var(--color-on-surface);
    font: var(--typescale-body-large);
    transition: outline-color 200ms;
}

.text-input:enabled:hover {
    outline-color: var(--color-on-surface);
}

.text-input:focus {
    outline-width: 2px;
    outline-color: var(--color-primary);
}
</style>