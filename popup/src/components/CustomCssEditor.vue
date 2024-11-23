<script setup>
import { ref, computed, inject } from 'vue'

const syncedStorage = inject('syncedStorage')

const textarea = ref(null)

const infoDialogActive = ref(false)
const warnDialogActive = ref(false)
const editing = ref(false)

const customCssValue = computed({
    get() {
        return (syncedStorage.value['custom-css'] ?? '') + (syncedStorage.value['custom-css2'] ?? '')
    },
    set(newValue) {
        console.log(syncedStorage.value['custom-css'].length, syncedStorage.value['custom-css2'].length)
        syncedStorage.value['custom-css'] = newValue?.substring(0, 8181) ?? ''
        syncedStorage.value['custom-css2'] = newValue?.substring(8181, 16361) ?? ''
        console.log(syncedStorage.value['custom-css'].length, syncedStorage.value['custom-css2'].length)
        if (byteSize(newValue) > 16361) warnDialogActive.value = true
    }
})

const byteSize = str => new Blob([str]).size

const cssVars = ['--st-font-family-primary', '--st-font-family-secondary', '--st-font-hero', '--st-font-primary', '--st-font-secondary', '--st-background-primary', '--st-background-secondary', '--st-background-tertiary', '--st-foreground-primary', '--st-foreground-secondary', , '--st-foreground-accent', '--st-highlight-primary', '--st-accent-primary', '--st-accent-primary-dark', '--st-border', '--st-contrast-accent']

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
                <span v-if="!editing || !syncedStorage['custom-css']" class="setting-subtitle">Lees eerst de
                    informatie!</span>
                <span v-else class="setting-subtitle">{{ byteSize([customCssValue || ''])
                    }}
                    /
                    16361
                    bytes gebruikt</span>
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
                De maximale lengte van je CSS-code is 16361 bytes. Als je code langer is, wordt deze niet
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
                De maximale lengte van je CSS-code is 16361 bytes. Je code is langer dan dit en wordt daarom niet
                volledig opgeslagen.
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