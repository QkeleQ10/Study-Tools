<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import BottomSheet from '../BottomSheet.vue';
import TextInput from '../inputs/TextInput.vue';

const props = defineProps(['modelValue', 'pickerOpen'])
const emit = defineEmits(['update:modelValue', 'update:pickerOpen'])

const value = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

const pickerOpen = computed({
    get() {
        return props.pickerOpen || false
    },
    set(value) {
        emit('update:pickerOpen', value)
    }
})

function updateUrl(newUrl) {
    value.value = newUrl
}
</script>

<template>
    <BottomSheet v-model:active="pickerOpen" :handle=true>
        <template #content>
            <TextInput :model-value="value" @update:model-value="updateUrl"
                :style="{ '--context-color': 'var(--color-surface-container-low)' }">
                <template #title>Afbeeldings-URL</template>
            </TextInput>
            <span class="supporting-text">Geef de koppeling van de afbeelding die je wilt gebruiken.</span>
        </template>
    </BottomSheet>
</template>

<style scoped>
.supporting-text {
    margin-top: 16px;
}
</style>