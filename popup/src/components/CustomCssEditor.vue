<script setup>
import { ref, inject } from 'vue'

const syncedStorage = inject('syncedStorage')

const infoDialogActive = ref(false)
const editing = ref(false)

const byteSize = str => new Blob([str]).size

const cssVars = ['--st-font-family-primary', '--st-font-family-secondary', '--st-font-hero', '--st-font-primary', '--st-font-secondary', '--st-background-primary', '--st-background-secondary', '--st-background-tertiary', '--st-foreground-primary', '--st-foreground-secondary', , '--st-foreground-accent', '--st-highlight-primary', '--st-accent-primary', '--st-accent-primary-dark', '--st-border', '--st-contrast-accent']

function selectEntireContents(event) {
    event.target.focus()
    // event.target.select()
    window.getSelection().selectAllChildren(event.target)
}

setTimeout(() => { if (!syncedStorage.value['custom-css']) infoDialogActive.value = true }, 100)

setTimeout(() => { if (syncedStorage.value['custom-css']) editing.value = true }, 1000)
</script>

<template>
    <div id="css-editor">
        <div class="header">
            <div>
                <h3 class="setting-title">CSS-editor</h3>
                <span v-if="!editing || !syncedStorage['custom-css']" class="setting-subtitle">Lees eerst de
                    informatie!</span>
                <span v-else class="setting-subtitle">{{ byteSize([syncedStorage['custom-css'] || ''])
                    }}
                    /
                    8181
                    bytes gebruikt</span>
            </div>
            <button class="button tonal" @click="infoDialogActive = true">
                <Icon>help</Icon>
                Informatie
            </button>
        </div>
        <textarea v-model="syncedStorage['custom-css']" autocomplete="off" autocorrect="off" autocapitalize="off"
            spellcheck="false" @keydown="editing = true"></textarea>
        <Dialog v-model:active="infoDialogActive">
            <template #text>
                <strong>Let op:</strong> Sluit dit venster voordat je wijzigingen maakt in het
                configuratiepaneel! Als je wijzigingen maakt in zowel dit venster als in het configuratiepaneel, dan kun
                je je voortgang verliezen.
                <br><br>
                De maximale lengte van je CSS-code is 8181 bytes. Als je code langer is, wordt deze niet
                opgeslagen. Optimaliseer je code en gebruik eventueel een CSS-minifier.
                <br><br>
                Enkele CSS-<code>:root</code>-variabelen die je kunt overschrijven zijn:<br>
                <span v-for="(v, i) in cssVars"><code @click="selectEntireContents"
                        @mouseenter="selectEntireContents">{{ v }}</code><span v-if="i !== cssVars.length - 1">,
                    </span></span><br>
                Er zijn er uiteraard meer, maar pas niet meer aan dan nodig is. Je kunt meer aanpassen via het configuratiepaneel dan je denkt.<br>
                Als je je kleurenschema dynamisch wilt maken, stel je je thema in op 'automatisch' en gebruik je de CSS-functie <code>light-dark()</code>.
                <br><br>
                Een bijzondere <code>:root</code>-regel die je kunt gebruiken is
                <code @click="selectEntireContents"
                    @mouseenter="selectEntireContents">--st-menu-collapse: disallow;</code>. Deze variabele voorkomt dat
                de zijbalk kan worden ingeklapt.
            </template>
            <template #buttons>
                <button @click="infoDialogActive = false">Sluiten</button>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
#css-editor {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 8px;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface-container);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 56px;
    padding-left: 8px;
    padding-bottom: 4px;
}

textarea {
    flex: 1;
    border: none;
    outline: none;
    resize: none;
    border-radius: 6px;
    padding: 8px;
    background-color: var(--color-surface-container-lowest);
    color: var(--color-on-surface);
}

code {
    color: var(--color-on-surface);
    white-space: nowrap;
    cursor: pointer;
}
</style>