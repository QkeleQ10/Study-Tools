<script setup>

import Icon from './Icon.vue'

const props = defineProps(['active'])
const emit = defineEmits(['update:active'])

const closeDialog = () => {
	emit('update:active', false)
}
</script>

<template>
	<div class="scrim" :active="props.active" @click="closeDialog"></div> <!-- v-if="props.active" -->
	<div class="dialog" :active="props.active">
		<Icon class="dialog-icon">
			<slot name="icon"></slot>
		</Icon>
		<h2 class="dialog-title center">
			<slot name="headline"></slot>
		</h2>
		<span class="dialog-description">
			<slot name="text"></slot>
		</span>
		<div class="dialog-actions">
			<slot name="buttons"></slot>
		</div>
	</div>
</template>

<style>
.dialog {
	position: fixed;
	top: 50%;
	left: 50%;
	display: flex;
	flex-direction: column;
	gap: 16px;
	translate: -50% -50%;
	transform: scaleY(.8) translateY(-20%);
	opacity: 0;
	min-width: 280px;
	max-width: min(calc(100vw - 112px), 560px);
	width: max-content;
	box-sizing: border-box;
	pointer-events: none;
	padding: 24px;
	border-radius: 28px;
	z-index: 10001;
	background-color: var(--color-surface-container-high);
	transition: transform 100ms, opacity 100ms;
}

.dialog[active=true] {
	pointer-events: all;
	transform: none;
	opacity: 1;
	transition-duration: 400ms;
	transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);;
}

.dialog-icon {
	width: 100%;
	color: var(--color-secondary);
	font-size: 24px;
	text-align: center;
}

.dialog-icon:empty {
	display: none;
}

.dialog-title {
	margin: 0;
	color: var(--color-on-surface);
	font: var(--typescale-headline-small);
}

.dialog-title:empty {
	display: none;
}

.dialog-title.center {
	text-align: center;
}

.dialog-description {
	color: var(--color-on-surface-variant);
	font: var(--typescale-body-medium);
	text-wrap: balance;
}

.dialog-description:empty {
	display: none;
}

.dialog-actions {
	display: flex;
	justify-content: right;
	align-items: center;
	gap: 0;
	width: 100%;
	margin-top: 8px;
}

.dialog-actions>button {
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