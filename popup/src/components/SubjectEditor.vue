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
            <template #icon>edit_note</template>
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
                <div class="subject-example">
                    <span>Weergavenaam vak</span>
                    <span>Aliassen</span>
                </div>
                <TransitionGroup name="editor" tag="ul" class="subjects-list">
                    <li v-for="(subject, i) in value" :key="i" class="subject-wrapper">
                        <input class="text-input" type="input" :value="value[i].name"
                            @input="editArray(i, { name: $event.target.value, aliases: value[i].aliases })" placeholder=" "
                            autocomplete="off" spellcheck="false">
                        <input class="text-input" type="input" :value="value[i].aliases"
                            @input="editArray(i, { name: value[i].name, aliases: $event.target.value })" placeholder=" "
                            autocomplete="off" spellcheck="false">
                        <button class="element-action" @click="removeFromArray(i)">
                            <Icon>delete</Icon>
                        </button>
                    </li>
                </TransitionGroup>
                <button class="button text" style="margin-top: 16px;"
                    @click="value = [...value, { name: '', aliases: '' }]">Toevoegen</button>
            </template>
        </DialogFullscreen>
    </div>
</template>

<style>
.subjects-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.subject-wrapper,
.subject-example {
    display: grid;
    grid-template-columns: 4fr 3fr auto;
    align-items: center;
    gap: 8px;
}

.subject-example {
    margin-bottom: 8px;
    translate: 16px;
    font: var(--typescale-label-medium);
}

.subject-wrapper .text-input {
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