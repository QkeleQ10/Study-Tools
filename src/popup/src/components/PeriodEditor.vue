<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

import Chip from './Chip.vue'
import Icon from './Icon.vue'
import DialogFullscreen from './DialogFullscreen.vue'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        return typeof props.modelValue === 'object' ? Object.values(props.modelValue) : props.modelValue
    },
    set(value) {
        console.log(value)
        emit('update:modelValue', value)
    }
})

const showDialog = ref(false)

function removeFromArray(i) {
    let clone = [...value.value]
    clone.splice(i, 1)
    value.value = clone
}

function editArray(i, newVal) {
    let clone = [...value.value]
    clone[i] = newVal
    value.value = clone
}
</script>

<template>
    <div class="inline-setting">
        <Chip @click="showDialog = true">
            <template #icon>edit_calendar</template>
            <template #label>
                <slot name="title"></slot>
            </template>
        </Chip>
        <DialogFullscreen fullscreen v-model:active="showDialog">
            <template #headline>
                <slot name="title"></slot>
            </template>
            <template #content>
                <slot name="subtitle"></slot>
                <br><br>
                <TransitionGroup name="editor" tag="ul" class="periods-list">
                    <li v-for="(period, i) in value" :key="i + 1" class="period-wrapper">
                        <span class="period-index">Periode {{ i + 1 }}</span>
                        <span class="period-interfix">week</span>
                        <input class="text-input" type="number" :value="value[i]"
                            @input="editArray(i, Number($event.target.value))" placeholder=" " autocomplete="off" min="1"
                            max="52">
                        <span class="period-interfix">tot</span>
                        <span class="period-end">{{ value[(i + 1) % value.length] || '?' }}</span>
                        <button class="period-remove" @click="removeFromArray(i)">
                            <Icon>delete</Icon>
                        </button>
                    </li>
                </TransitionGroup>
            </template>
            <template #buttons>
                <button @click="value = [...value, undefined]">Toevoegen</button>
            </template>
        </DialogFullscreen>
    </div>
</template>

<style>
.periods-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.period-wrapper {
    display: grid;
    align-items: center;
    grid-template-columns: 2fr auto auto auto auto auto;
    gap: 8px;
}

.period-index {
    font: var(--typescale-body-large);
}

.period-interfix {
    font: var(--typescale-label-medium);
}

.period-end {
    width: 50px;
    font: var(--typescale-body-large);
}

.period-wrapper .text-input {
    width: 75px;
    box-sizing: border-box;
}

.period-remove {
    background-color: transparent;
    border: none;
    font-size: 24px;
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 12px;
    cursor: pointer;
}

.editor-enter-active,
.editor-leave-active {
    transition: all 200ms ease;
}

.editor-enter-from,
.editor-leave-to {
    opacity: 0;
    border-bottom: none;
    transform: translateX(-30px);
}
</style>