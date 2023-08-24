<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

import BottomSheet from './BottomSheet.vue'
import Icon from './Icon.vue'

const props = defineProps(['modelValue', 'id'])
const emit = defineEmits(['update:modelValue'])
const value = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

const RESOLUTION = 56
const QUALITY = 0.3

let isFirefox = window.navigator.userAgent.match(/Firefox\/([0-9]+)\./gi)

const input = ref(null)

let pickerOpen = ref(false)
let selected = ref(false)

function promptImage() {
    pickerOpen.value = true
    document.addEventListener('paste', e => {
        if (!pickerOpen.value) return
        input.value.files = e.clipboardData.files
        imageChanged()
    }, { once: true })
}

function imageChanged() {
    const file = input.value.files[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = function () {
            const image = new Image()
            image.onload = function () {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                canvas.width = RESOLUTION
                canvas.height = RESOLUTION
                ctx.drawImage(image, 0, 0, RESOLUTION, RESOLUTION)
                value.value = canvas.toDataURL('image/webp', QUALITY) || canvas.toDataURL('image/jpeg', QUALITY)
                selected.value = true
            }
            image.src = reader.result
            setTimeout(() => {
                pickerOpen.value = false
                selected.value = false
            }, 1000)
        }
        reader.readAsDataURL(file)
    }
}
</script>

<template>
    <div class="setting image-input" ref="label">
        <div class="image-input-click-layer" @click="promptImage">
            <img v-if="value" class="image-input-avatar" :class="{ selected: selected }" :src="value" width=40 height=40>
            <div v-else class="image-input-avatar">
                <Icon>add_photo_alternate</Icon>
            </div>
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
        <BottomSheet v-model:active="pickerOpen" :handle=true>
            <template #content>
                <span class="supporting-text">Gekozen afbeelding</span>
                <div class="image-wrapper">
                    <img v-if="value" class="image-picker-selected" :class="{ selected: selected }" :src="value" width=56
                        height=56>
                    <div v-else class="image-picker-selected">
                        <Icon>add_photo_alternate</Icon>
                    </div>
                    <span class="supporting-text">{{ (value || '').length.toLocaleString('nl-NL') }} bytes<br>De afbeelding
                        is verkleind en gecomprimeerd, maar het effect is op Magister niet merkbaar.</span>
                </div>
                <div class="what-next">
                    Afbeelding plakken
                    <span class="keybind">Ctrl</span>
                    <span class="keybind">V</span>
                </div>
                <input type="file" :id="id" ref="input" accept="image/*" @change="imageChanged">
                <button class="bottom-sheet-action" v-if="!isFirefox" @click="input.click()">
                    <Icon>drive_folder_upload</Icon>
                    <span>Afbeelding uploaden</span>
                </button>
                <span class="supporting-text" v-else>Jouw browser ondersteunt het uploaden van afbeeldingen niet. Je kunt wel een afbeelding plakken.</span>
            </template>
        </BottomSheet>
    </div>
</template>

<style>
.image-input-click-layer {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 16px;
    align-items: center;
    margin-left: -16px;
    margin-right: -24px;
    margin-block: -12px;
    padding-left: 16px;
    padding-right: 24px;
    padding-block: 12px;
    cursor: pointer;
}

.image-input-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background-color: var(--color-surface-container-highest);
    color: var(--color-on-surface-variant);
}

.image-input input[type=file] {
    position: absolute;
    height: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
}

.image-input .image-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-block: 12px;
    border-bottom: 1px solid var(--color-outline-variant);
}

.image-picker-selected {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 56px;
    width: 56px;
    height: 56px;
    opacity: 40%;
    background-color: var(--color-surface-container-highest);
    color: var(--color-on-surface-variant);
    transition: opacity 200ms;
}

.image-picker-selected.selected {
    opacity: 1;
    animation: lockInImage 200ms 2 alternate;
}

.what-next {
    padding-block: 16px;
    color: var(--color-on-surface-variant);
    font: var(--typescale-body-large);
    border-bottom: 1px solid var(--color-outline-variant);
}

@keyframes lockInImage {
    to {
        scale: 1.3;
    }
}
</style>