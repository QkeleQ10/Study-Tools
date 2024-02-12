<script setup>
import { ref, computed, defineEmits } from 'vue'
import { useManifest, useSyncedStorage } from '@/composables/chrome.js'

import Icon from './Icon.vue'
import Dialog from './Dialog.vue'
import InputText from './InputText.vue'

const emit = defineEmits(['resetSettings'])

const { manifest } = useManifest()
const syncedStorage = useSyncedStorage()

const disclaimerOpen = ref(false)
const resetDialogActive = ref(false)
const settingsInputDialogActive = ref(false)

const settingsString = computed({
    get() {
        try {
            return JSON.stringify(syncedStorage.value) || {}
        } catch {
            return {}
        }
    },
    set(value) {
        try {
            syncedStorage.value = JSON.parse(value) || syncedStorage.value || {}
            return syncedStorage.value
        } catch {
            syncedStorage.value = syncedStorage.value || {}
            return syncedStorage.value
        }
    }
})

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
        <h4 id="about-hero">Study Tools voor Magister (<button class="button text inline"
                @click="openInNewTab('https://github.com/QkeleQ10/Study-Tools/blob/dev/updates.json')">
                <span>versie {{ manifest.version || "onbekend" }}</span>
            </button>)</h4>
        <p id="about-description">
            Ontwikkeld door Quinten Althues<br>
            Bedankt voor het gebruiken van Study Tools!<br>
            
        </p>
        <div id="about-buttons">
            <button class="button" @click="openInNewTab('https://qkeleq10.github.io/studytools')">
                <Icon>captive_portal</Icon><span>Website</span>
            </button>
            <button class="button tonal" @click="openInNewTab('mailto:quinten@althues.nl?subject=Study Tools')">
                <Icon>alternate_email</Icon><span>E-mail</span>
            </button>
            <button class="button tonal" @click="openInNewTab('https://discord.gg/2rP7pfeAKf')">
                <Icon>forum</Icon><span>Discord</span>
            </button>
            <button class="button tonal" @click="openInNewTab('https://paypal.me/QkeleQ10')">
                <Icon>volunteer_activism</Icon><span>PayPal</span>
            </button>
            <button class="button tonal" @click="disclaimerOpen = true">
                <Icon>shield_locked</Icon><span>Privacybeleid</span>
            </button>
        </div>
        <Dialog v-model:active="disclaimerOpen">
            <template #icon>info</template>
            <template #headline>Informatie</template>
            <template #text>
                Deze extensie slaat gegevens over je identiteit, je accounts en je instellingen op in de
                browser. Afhankelijk van je browserinstellingen worden ze al dan niet opgeslagen in de cloud. Er wordt nooit
                informatie doorgestuurd naar de ontwikkelaar of naar derden.<br>
                <br>
                Ik kan onder geen enkele omstandigheid je gegevens zien. Ik kan alleen zien hoe veel gebruikers mijn
                extensie gebruiken en andere statistieken zoals percentages van besturingssystemen. Ik kan dus niet per
                gebruiker dingen zien en Magister-gegevens zijn compleet ontoegankelijk voor mij.
            </template>
            <template #buttons>
                <button @click="disclaimerOpen = false">Begrepen</button>
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
        <button id="about-export" @click="settingsInputDialogActive = true">
            <div>
                <h3 class="setting-title">
                    Voorkeuren kopiëren/plakken
                </h3>
            </div>
            <Icon>chevron_right</Icon>
        </button>
        <Dialog v-model:active="settingsInputDialogActive">
            <template #icon>restart_alt</template>
            <template #headline>Voorkeuren kopiëren/plakken</template>
            <template #text>Kopieer de inhoud van het tekstvak om je voorkeuren op te slaan op je klembord. Plak in het
                tekstvak om voorkeuren te wijzigen. Als je plakt, dan gaan al je huidige voorkeuren verloren.<br><br>
                <InputText id="settings-paste-input" v-model="settingsString" @focus="$event.target.select()">
                    <template #title>Plak hier</template>
                </InputText>
            </template>
            <template #buttons>
                <button @click="settingsInputDialogActive = false">Sluiten</button>
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
    grid-column: span 2;
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
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 8px;
}

#about-reset,
#about-export,
#about-import {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 56px;
    padding-block: 12px;
    padding-inline: 0;
    background-color: transparent;
    border: none;
    border-bottom: 1px solid var(--color-surface-variant);
    cursor: pointer;
}

#about-reset {
    margin-top: 12px;
    border-top: 1px solid var(--color-surface-variant);
}
</style>