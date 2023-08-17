<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { useElementSize } from '@vueuse/core'

import Icon from './Icon.vue'

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])

const label = ref(null)
const { height } = useElementSize(label)

const value = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})
</script>

<template>
    <label class="setting text" :for="id" ref="label" :class="{ tall: height > 70 }">
        <div>
            <h3 class="setting-title">
                <slot name="title"></slot>
            </h3>
            <span class="setting-subtitle">
                <slot name="subtitle"></slot>
            </span>
        </div>
        <input type="input" :id="id" v-model="value">
    </label>
</template>

<style>

</style>