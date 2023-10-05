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

function moveItem(from, to) {
    let clone = [...value.value]
    if (to < 0 || to >= clone.length) return
    let element = clone.splice(from, 1)[0]
    clone.splice(to, 0, element)
    value.value = clone
}
</script>

<template>
    <div class="setting">
        <button class="shortcuts-editor-click-layer" @click="showDialog = true">
            <div>
                <h3 class="setting-title">
                    <slot name="title"></slot>
                </h3>
                <span class="setting-subtitle">
                    <slot name="subtitle"></slot>
                </span>
            </div>
            <Icon>chevron_right</Icon>
        </button>
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
                    <li v-for="(shortcut, i) in value" :key="shortcut.icon" class="shortcut-wrapper">
                        <IconInput v-model="value[i].icon"
                            @input="(v) => editArray(i, { icon: v, href: value[i].href, hotkey: value[i].hotkey })" />
                        <input class="text-input" type="input" :value="value[i].href"
                            @input="editArray(i, { icon: value[i].icon, href: $event.target.value.replace('https://', ''), hotkey: value[i].hotkey })"
                            placeholder=" " autocomplete="off" spellcheck="false">
                        <KeyInput v-model="value[i].hotkey" :allowClear="true"
                            @input="(v) => editArray(i, { icon: value[i].icon, href: value[i].href, hotkey: v })" />
                        <div class="shortcut-actions">
                            <button class="element-action" @click="removeFromArray(i)">
                                <Icon>delete</Icon>
                            </button>
                            <button class="element-action" @click="moveItem(i, i - 1)">
                                <Icon>keyboard_arrow_up</Icon>
                            </button>
                            <button class="element-action" @click="moveItem(i, i + 1)">
                                <Icon>keyboard_arrow_down</Icon>
                            </button>
                        </div>
                        <!--clean up delete button and add drag to change order-->
                    </li>
                </TransitionGroup>
                <button class="button text" style="margin-top: 16px;"
                    @click="value = [...value, { icon: '', href: '', hotkey: '' }]">Toevoegen</button>
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
    padding-block: 0;
    min-height: 56px;
    box-sizing: content-box;
    background-color: transparent;
    border: none;
    width: 100%;
    text-align: left;
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
    grid-template-columns: 56px 1fr 56px 52px;
    gap: 8px;
}

.shortcut-example {
    margin-bottom: 8px;
    translate: 16px;
    font: var(--typescale-label-medium);
}

.shortcut-wrapper .text-input {
    width: 100%;
    box-sizing: border-box;
}

.shortcut-actions {
    display: grid;
    grid-template:
        'up delete' 1fr
        'down delete' 1fr
        / 1fr 1fr;
    align-items: center;
}

.shortcut-actions>button:first-child {
    grid-area: delete;
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