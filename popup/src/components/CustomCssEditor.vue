<script setup>
import { ref, computed, inject } from 'vue'

const syncedStorage = inject('syncedStorage')

const bytesLimit = (8192 * 2)
const bytesUnusable = 12 - (13 * 1)
const bytesUsable = bytesLimit - bytesUnusable
const bytesUsed = () => (JSON.stringify(syncedStorage.value['custom-css']).length + 'custom-css'.length + JSON.stringify(syncedStorage.value['custom-css2']).length + 'custom-css2'.length)

const textarea = ref(null)

const infoDialogActive = ref(false)
const warnDialogActive = ref(false)
const editing = ref(false)

const customCssValue = computed({
    get() {
        let value = (syncedStorage.value['custom-css'] ?? '') + (syncedStorage.value['custom-css2'] ?? '')
        let formattedValue = value
        return formattedValue
    },
    set(value) {
        let minifiedValue = value
        const parts = splitStringByJsonByteLength(minifiedValue, [8192 - 10, 8192 - 11])
        syncedStorage.value['custom-css'] = parts[0]
        syncedStorage.value['custom-css2'] = parts[1]

        if (bytesUsed() > bytesLimit) warnDialogActive.value = true
    }
})

function splitStringByJsonByteLength(input, partsMaxLengths) {
    const encodeForJson = (str) => JSON.stringify(str).length
    const parts = Array(partsMaxLengths.length).fill('') // Initialize all parts with empty strings

    let remaining = input

    for (let i = 0; i < partsMaxLengths.length; i++) {
        let part = remaining

        // Find the split point for the current part
        while (encodeForJson(part) > partsMaxLengths[i]) {
            part = part.slice(0, -1) // Trim the last character until it fits
        }

        parts[i] = part // Assign the valid part
        remaining = remaining.slice(part.length) // Update the remaining string

        if (!remaining) break // Stop if there's nothing left to split
    }

    return parts
}

const cssVars = ['--st-font-family-primary', '--st-font-family-secondary', '--st-font-hero', '--st-font-primary', '--st-font-secondary', '--st-background-primary', '--st-background-secondary', '--st-background-tertiary', '--st-foreground-primary', '--st-foreground-secondary', , '--st-foreground-accent', '--st-highlight-primary', '--st-accent-primary', '--st-accent-primary-dark', '--st-border', '--st-contrast-accent', '--mg-logo-expanded', '--mg-logo-collapsed', '--st-favicon']

function selectEntireContents(event) {
    event.target.focus()
    // event.target.select()
    window.getSelection().selectAllChildren(event.target)
}

function tabPressed(e) {
    const element = e.target
    e.preventDefault()
    const start = element.selectionStart
    const end = element.selectionEnd

    element.value = element.value.substring(0, start) + "  " + element.value.substring(end)

    // put caret at right position again
    element.selectionStart = element.selectionEnd = start + 2
}

setTimeout(() => { if (!syncedStorage.value['custom-css']) infoDialogActive.value = true }, 100)

setTimeout(() => { if (syncedStorage.value['custom-css']) editing.value = true }, 1000)
</script>

<template>
    <div id="css-editor">
        <div class="header">
            <div>
                <h3 class="setting-title">CSS-editor</h3>
                <span v-if="!editing || (!syncedStorage['custom-css'] && !syncedStorage['custom-css2'])"
                    class="setting-subtitle">
                    Lees eerst de informatie!
                </span>
                <span v-else class="setting-subtitle">
                    {{ bytesUsed() - bytesUnusable }} / {{ bytesUsable }} bytes
                    <span v-if="bytesUsed() > bytesLimit"> (niet opgeslagen!)</span>
                </span>
            </div>
            <button class="button tonal" @click="infoDialogActive = true">
                <Icon>help</Icon>
                Informatie
            </button>
        </div>
        <textarea ref="textarea" v-model="customCssValue" autocomplete="off" autocorrect="off" autocapitalize="off"
            spellcheck="false" @keydown="editing = true" @keydown.tab="tabPressed"></textarea>
        <Dialog v-model:active="infoDialogActive">
            <template #text>
                De maximale lengte van je CSS-code is {{ bytesUsable }} bytes. Als je code langer is, wordt deze niet
                opgeslagen. Optimaliseer je code en gebruik eventueel een CSS-minifier.
                <br><br>
                Enkele CSS-<code>:root</code>-variabelen die je kunt overschrijven zijn:<br>
                <span v-for="(v, i) in cssVars"><code @click="selectEntireContents"
                        @mouseenter="selectEntireContents">{{ v }}</code><span v-if="i !== cssVars.length - 1">,
                    </span></span><br>
                Er zijn er uiteraard meer, maar pas niet meer aan dan nodig is. Je kunt meer aanpassen via het
                configuratiepaneel dan je denkt.<br>
                Als je je kleurenschema dynamisch wilt maken, stel je je thema in op 'automatisch' en gebruik je de
                CSS-functie <code>light-dark()</code>.
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
        <Dialog v-model:active="warnDialogActive">
            <template #icon>warning</template>
            <template #headline>Niet opgeslagen</template>
            <template #text>
                De maximale lengte van je CSS-code is {{ bytesUsable }} bytes. Je code is langer dan dit en je
                wijzigingen
                zijn dus
                niet opgeslagen! Optimaliseer je code en gebruik eventueel een CSS-minifier.
            </template>
            <template #buttons>
                <button @click="warnDialogActive = false">Sluiten</button>
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