<script setup>
import { ref } from 'vue'
import { useScroll } from '@vueuse/core'

import Icon from './Icon.vue'

const props = defineProps(['active', 'fullscreen'])
const emit = defineEmits(['update:active'])

const closeDialog = () => {
	emit('update:active', false)
}

const content = ref(null)
const { y } = useScroll(content)
</script>

<template>
	<div class="fullscreen-dialog" :active="props.active" :tabindex="props.active ? 0 : -1">
		<div class="fullscreen-dialog-header" :scrolled="y > 16">
			<button class="fullscreen-dialog-close" @click="closeDialog">
				<Icon>close</Icon>
			</button>
			<h2 class="fullscreen-dialog-title">
				<slot name="headline"></slot>
			</h2>
			<div class="fullscreen-dialog-actions">
				<slot name="buttons"></slot>
			</div>
		</div>
		<span class="fullscreen-dialog-content" ref="content">
			<slot name="content"></slot>
		</span>
	</div>
</template>

<style>
.fullscreen-dialog {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	max-width: none;
	height: 100%;
	display: grid;
	grid-template-rows: auto 1fr;
	transform: scale(.9) translateY(10%);
	border-radius: 28px;
	opacity: 0;
	pointer-events: none;
	z-index: 10001;
	background-color: var(--color-surface-container-high);
	box-shadow: 0 0 16px 0 var(--color-shadow);
	overflow: hidden;
	transition: transform 200ms, opacity 200ms, border-radius 200ms;
}

.fullscreen-dialog[active=true] {
	pointer-events: all;
	transform: none;
	opacity: 1;
	border-radius: 0;
}

.fullscreen-dialog-header {
	padding-inline: 16px;
	padding-top: 8px;
	display: grid;
	grid-template-columns: auto 1fr auto;
	grid-template-rows: 56px;
	align-items: center;
	gap: 16px;
	background-color: var(--color-surface-container-high);
}

.fullscreen-dialog-header[scrolled=true] {
	background-color: var(--color-surface-container-highest);
}

.fullscreen-dialog-content {
	overflow-y: auto;
	overflow-x: hidden;
	padding-inline: 24px;
	padding-block: 4px;
    padding-bottom: 24px;
	color: var(--color-on-surface-variant);
	font: var(--typescale-body-medium);
}

.fullscreen-dialog-close {
	background-color: transparent;
	border: none;
	font-size: 24px;
	padding: 0;
	width: 24px;
	height: 24px;
	border-radius: 20px;
	color: var(--color-on-surface);
	cursor: pointer;
}

.fullscreen-dialog-title {
	margin: 0;
	color: var(--color-on-surface);
	font: var(--typescale-title-large);
}

.fullscreen-dialog-actions {
	display: flex;
	justify-content: right;
	align-items: center;
	gap: 0;
	width: 100%;
}

.fullscreen-dialog-actions>button {
	height: 40px;
	padding-inline: 12px;
	padding-block: 0;
	font: var(--typescale-label-large);
	color: var(--color-primary);
	background-color: transparent;
	border: none;
	border-radius: 20px;
	cursor: pointer;
}
</style>