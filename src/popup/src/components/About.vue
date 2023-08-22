<script setup>
import { ref } from 'vue'

import Icon from './Icon.vue'
import Dialog from './Dialog.vue'

const disclaimerOpen = ref(false)

function openInNewTab(url) {
    window.open(url, '_blank', 'noreferrer')
}
</script>

<template>
    <div id="about">
        <h4 id="about-hero">Ontwikkeld door Quinten Althues</h4>
        <p id="about-description">Bedankt voor het gebruiken van Study Tools!</p>
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
        <button class="button text" @click="disclaimerOpen = true">Privacy- en update-informatie</button>
        <Dialog v-model:active="disclaimerOpen">
            <template #icon>info</template>
            <template #headline>Informatie</template>
            <template #text>Deze extensie slaat gegevens over je identiteit, je accounts en je instellingen op in de
                browser. Afhankelijk van je browserinstellingen worden ze al dan niet opgeslagen in de cloud.<br><br>De
                ontwikkelaar aanvaardt geen aansprakelijkheid voor schade (zoals gelekte wachtwoorden) door
                beveiligingsgebreken aan de kant van de gebruiker of de browser (zoals het niet gebruiken van een
                apparaatwachtwoord).</template>
            <template #buttons>
                <button
                    @click="openInNewTab('https://github.com/QkeleQ10/Study-Tools/blob/dev/updates.json')">Updatelogboek</button>
                <button @click="disclaimerOpen = false">Annuleren</button>
            </template>
        </Dialog>
    </div>
</template>

<style>
#about {
    padding-left: 16px;
    padding-right: 24px;
    padding-block: 12px;
    color: var(--color-on-surface);
    font: var(--typescale-body-large);
    border-bottom: 1px solid var(--color-outline-variant);
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

#about .button {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding-inline: 24px;
    border-radius: 20px;
    background-color: var(--color-primary);
    color: var(--color-on-primary);
    font: var(--typescale-label-large);
    border: none;
    cursor: pointer;
}

#about .button.tonal {
    background-color: var(--color-secondary-container);
    color: var(--color-on-secondary-container)
}

#about .button.text {
    background-color: transparent;
    color: var(--color-primary);
    padding-inline: 12px;
}

#about .button .icon {
    font-size: 18px;
    margin-left: -8px;
}
</style>