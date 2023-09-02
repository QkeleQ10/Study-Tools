<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

import Icon from './Icon.vue'
import DialogFullscreen from './DialogFullscreen.vue'
import KeyInput from './KeyInput.vue';
import IconInput from './IconInput.vue';

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        return typeof props.modelValue === 'object' ? Object.values(props.modelValue) : props.modelValue
    },
    set(value) {
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
    <div class="setting">
        <div class="shortcuts-editor-click-layer" @click="showDialog = true">
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
        <DialogFullscreen fullscreen v-model:active="showDialog">
            <template #headline>
                <slot name="title"></slot>
            </template>
            <template #content>
                <slot name="subtitle"></slot>
                <br>
                <div class="shortcut-example">
                    <span>Icoon</span>
                    <span>URL</span>
                    <span>Sneltoets</span>
                </div>
                <TransitionGroup name="editor" tag="ul" class="shortcuts-list">
                    <li v-for="(shortcut, i) in value" :key="i" class="shortcut-wrapper">
                        <IconInput v-model="value[i].icon"
                            @input="(v) => editArray(i, { icon: v, href: value[i].href, hotkey: value[i].hotkey })" />
                        <input class="text-input" type="input" :value="value[i].href"
                            @input="editArray(i, { icon: value[i].icon, href: $event.target.value, hotkey: value[i].hotkey })"
                            placeholder=" " autocomplete="off" spellcheck="false">
                        <KeyInput v-model="value[i].hotkey"
                            @input="(v) => editArray(i, { icon: value[i].icon, href: value[i].href, hotkey: v })" />
                        <button class="period-remove" @click="removeFromArray(i)">
                            <Icon>delete</Icon>
                        </button>
                    </li>
                </TransitionGroup>
            </template>
            <template #buttons>
                <button @click="value = [...value, { icon: '', href: '', hotkey: '' }]">Toevoegen</button>
            </template>
        </DialogFullscreen>
    </div>
</template>

<style>
.shortcuts-editor-click-layer {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: center;
    margin-left: -16px;
    margin-right: -24px;
    margin-block: -12px;
    padding-left: 16px;
    padding-right: 24px;
    padding-block: 12px;
    min-height: 56px;
    box-sizing: border-box;
    cursor: pointer;
}

.shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.shortcut-wrapper,
.shortcut-example {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 8px;
}

.shortcut-example {
    margin-bottom: 8px;
    margin-right: 32px;
    translate: 16px;
    font: var(--typescale-label-medium);
}

.shortcut-wrapper .text-input {
    width: 100%;
    box-sizing: border-box;
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