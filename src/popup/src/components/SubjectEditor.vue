<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

import Chip from './Chip.vue'
import DialogFullscreen from './DialogFullscreen.vue'

const props = defineProps(['modelValue', 'setting'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
    get() {
        return props.modelValue || props.setting.default
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

const showDialog = ref(false)
</script>

<template>
    <Chip @click="showDialog = true">
        <template #icon>edit_note</template>
        <template #label>Vaknamen bewerken</template>
    </Chip>
    <DialogFullscreen fullscreen v-model:active="showDialog">
        <template #headline>Vaknamen bewerken</template>
        <template #content>
            <TransitionGroup>
                <div v-for="a in value" :key="a.name"></div>
            </TransitionGroup>
        </template>
        <template #buttons>
            <button @click="showDialog = false">Opslaan</button>
        </template>
    </DialogFullscreen>
</template>

<style></style>