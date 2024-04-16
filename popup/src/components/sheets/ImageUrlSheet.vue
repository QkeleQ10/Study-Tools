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
        </template>
    </BottomSheet>
</template>

<style scoped>
.color-maker {
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    gap: 30px;
}

.hue-wheel {
    position: relative;
    width: 200px;
    aspect-ratio: 1;
    border-radius: 50%;
    cursor: crosshair;
}

.knob {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 3px 0 var(--color-shadow);
    pointer-events: none;
}

.hue-wheel-knob {
    top: -1px;
    left: 50%;
    transform-origin: 0 100.5px;
}

.hue-wheel-example {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 65%;
    aspect-ratio: 1;
    translate: -50% -50%;

    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;

    color: #ffffff;
}

.col-right {
    flex: 1 1 0;

    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
    gap: 30px;
}

.color-bar {
    position: relative;
    height: 20px;
    cursor: crosshair;
    border-radius: 10px;
}

.color-bar-knob {
    top: 50%;
    translate: -50% -50%;
}

.invoke-eyedropper {
    width: max-content;
    margin-top: auto;
    margin-left: auto;
}
</style>