<script setup>
import { ref, defineEmits } from 'vue'
import { useManifest } from '@/composables/chrome.js'

import Icon from './Icon.vue'
import Dialog from './Dialog.vue'

const emit = defineEmits(['resetSettings'])

const { manifest } = useManifest()

const disclaimerOpen = ref(false)
const resetDialogActive = ref(false)

function resetSettings() {
    emit('resetSettings')
    resetDialogActive.value = false
}

function openInNewTab(url) {
    window.open(url, '_blank', 'noreferrer')
}
</script>

<template>
    <div id="about">
        <h4 id="about-hero">Ontwikkeld door Quinten Althues</h4>
        <p id="about-description">
            Bedankt voor het gebruiken van Study Tools!
            <br>
            Versie: {{ manifest.version || "onbekend" }}
        </p>
        <div id="about-buttons">
            <button class="button" @click="openInNewTab('https://qkeleq10.github.io/studytools')">
                <Icon>open_in_new</Icon><span>Website</span>
            </button>
            <button class="button tonal" @click="openInNewTab('https://paypal.me/QkeleQ10')">
                <Icon>volunteer_activism</Icon><span>PayPal</span>
            </button>
            <button class="button tonal"
                @click="openInNewTab('mailto:quinten@althues.nl?subject=Feedback m.b.t. Study Tools')">
                <Icon>feedback</Icon><span>Feedback</span>
            </button>
        </div>
        <button class="button text" @click="disclaimerOpen = true">Versie-informatie en privacystatement</button>
        <Dialog v-model:active="disclaimerOpen">
            <template #icon>info</template>
            <template #headline>Informatie</template>
            <template #text>
                <b>Versie: {{ manifest.version || "onbekend" }}</b>
                <br><br>
                Deze extensie slaat gegevens over je identiteit, je accounts en je instellingen op in de
                browser. Afhankelijk van je browserinstellingen worden ze al dan niet opgeslagen in de cloud. Er wordt nooit
                informatie doorgestuurd naar de ontwikkelaar of naar derden.</template>
            <template #buttons>
                <button
                    @click="openInNewTab('https://github.com/QkeleQ10/Study-Tools/blob/dev/updates.json')">Updatelogboek</button>
                <button @click="disclaimerOpen = false">Annuleren</button>
            </template>
        </Dialog>
        <button id="about-reset" @click="resetDialogActive = true">
            <div>
                <h3 class="setting-title">
                    Voorkeuren wissen
                </h3>
            </div>
            <Icon>chevron_right</Icon>
        </button>
        <Dialog v-model:active="resetDialogActive">
            <template #icon>restart_alt</template>
            <template #headline>Voorkeuren wissen?</template>
            <template #text>Hiermee stel je alle instellingen van Study Tools in op de standaardwaarden.</template>
            <template #buttons>
                <button @click="resetDialogActive = false">Annuleren</button>
                <button @click=resetSettings>Wissen</button>
            </template>
        </Dialog>
    </div>
</template>

<style>
#about {
    margin-inline: 16px;
    padding-top: 12px;
    color: var(--color-on-surface);
    font: var(--typescale-body-large);
}

#about-hero {
    color: var(--color-on-surface);
    font: var(--typescale-body-large);
    margin: 0;
}

#about-description {
    color: var(--color-on-surface);
    font: var(--typescale-body-medium);
    margin: 0;
    margin-bottom: 16px;
}

#about-buttons {
    display: flex;
    gap: 8px;
    padding-bottom: 8px;
}

#about-reset {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 56px;
    margin-top: 12px;
    padding-block: 12px;
    padding-inline: 0;
    background-color: transparent;
    border: none;
    border-block: 1px solid var(--color-surface-variant);
    cursor: pointer;
}
</style>