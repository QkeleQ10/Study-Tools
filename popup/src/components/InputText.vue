<script setup>
import { ref, computed, defineEmits, defineProps, defineOptions } from 'vue'
import { useFocus } from '@vueuse/core'

const props = defineProps(['id', 'modelValue'])
const emit = defineEmits(['update:modelValue'])

defineOptions({
	inheritAttrs: false
})

const value = computed({
	get() {
		return props.modelValue
	},
	set(value) {
		emit('update:modelValue', value)
	}
})

const input = ref(null)
const { focused } = useFocus(input)

const filled = computed(() => {
	return value?.value?.length > 0
})
</script>

<template>
	<label class="text-input-label" :for="id" :class="{ focused: focused, filled: filled }">
		<input class="text-input" type="input" :id="id" ref="input" v-model.lazy="value" placeholder=" " autocomplete="off" v-bind="$attrs">
		<div class="border-cutout">
			<slot name="title"></slot>
		</div>
		<h3 class="setting-title">
			<slot name="title"></slot>
		</h3>
		<span class="setting-subtitle">
			<slot name="subtitle"></slot>
		</span>
	</label>
</template>

<style>
.text-input-label {
	position: relative;
	display: grid;
	grid-template-rows: 1fr auto;
	gap: 4px;
}

.text-input-label .setting-title {
	position: absolute;
	left: 16px;
	top: 14px;
	color: var(--color-on-surface-variant);
	font: var(--typescale-body-large);
	pointer-events: none;
	transition: color 200ms, top 200ms, font 200ms;
}

.text-input-label.focused .setting-title,
.text-input-label.filled .setting-title {
	top: -8px;
	font-size: 12px;
	line-height: 16px;
}

.text-input-label.focused .setting-title {
	color: var(--color-on-surface);
}

.text-input-label.focused .setting-title {
	color: var(--color-primary);
}

.text-input-label .border-cutout {
	position: absolute;
	top: -6px;
	left: 12px;
	font: var(--typescale-body-large);
	font-size: 12px;
	line-height: 16px;
	padding-inline: 4px;
	background-color: var(--color-surface);
	color: transparent;
	border-radius: 4px;
	scale: 0 1;
	pointer-events: none;
	transition: scale 200ms;
}

.dialog .text-input-label .border-cutout {
	background-color: var(--color-surface-container-high);
}

.text-input-label.focused .border-cutout,
.text-input-label.filled .border-cutout {
	scale: 1;
}

.text-input-label .setting-subtitle {
	color: var(--color-on-surface-variant);
	font: var(--typescale-body-small);
	margin-left: 16px;
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