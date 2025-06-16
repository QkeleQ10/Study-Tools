<script setup>
import { ref, inject } from 'vue'
import settings from '/public/settings.js'
import { presets, propertyKeys } from '/public/themePresets.js'
import MagisterThemePreview from '@/components/MagisterThemePreview.vue'
import SwitchInput from '@/components/SwitchInput.vue'
import Slider from '@/components/setting-types/Slider.vue'
import ImageInput from '@/components/ImageInput.vue'
import ShortcutsEditor from '@/components/ShortcutsEditor.vue'
import Text from '@/components/setting-types/Text.vue'
import SingleChoice from '@/components/setting-types/SingleChoice.vue'
import ColorOverrideSetting from '@/components/setting-types/ColorOverrideSetting.vue'
import DecorationPickerSetting from '@/components/setting-types/DecorationPickerSetting.vue'
import LinkToOptionsTab from '@/components/setting-types/LinkToOptionsTab.vue'
import Dialog from '@/components/Dialog.vue'

const optionTypes = { SwitchInput, Slider, ImageInput, ShortcutsEditor, Text, SingleChoice, ColorOverrideSetting, DecorationPickerSetting, LinkToOptionsTab }

const syncedStorage = inject('syncedStorage')
const localStorage = inject('localStorage')

const importDialog = ref(false)
const selectedThemeId = ref(null)

const store = ref({
    version: "1.0",
    themes: [
        {
            id: 1,
            STVersion: 3.13,
            name: "Magister",
            description: "Het is magister, wat wil je nog meer weten?",
            author: "Magister"
        },
        {
            id: 2,
            STVersion: 3.13,
            name: "Magister Dark",
            description: "Het is magister, maar dan in het donker.",
            author: "Siemvk",
            ptheme: "dark,207,95,2",
            pagecolor: "false,0,0,58",
            sidecolor: "true,207,95,0"
        },
        {
            name: "Minecraft",
            author: "TheOakTrees & Nick Verbruggen",
            thumbnail: "https://i.imgur.com/V5loO5Z.png",
            "ptheme": "dark,0,0,48.2",
            "pagecolor": "false,223,6.7,20.6",
            "wallpaper": "custom,https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/themeassets/minecraft/landscape.webp",
            "sidecolor": "true,0,0,43.5",
            "decoration": "custom,https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/themeassets/minecraft/dirt.webp",
            "decoration-size": 0.8,
            "appbarcolor": "true,0,0,43.5",
            "shape": 0,
            "custom-css": `.examen-widget,.main-menu .caption,.st-title,.title,h2,h3{font-family:var(--st-font-family-secondary)!important}@font-face{font-family:Minecraftia;src:url("https://unpkg.com/@south-paw/typeface-minecraft@1.0.0/files/minecraft.woff2") format("woff2"),url("https://unpkg.com/@south-paw/typeface-minecraft@1.0.0/files/minecraft.woff") format("woff");font-weight:600}:root{--st-font-family-primary:Minecraftia!important;--st-font-family-secondary:Minecraftia!important;--st-background-secondary:#000000a6}:host{--title-font:Minecraftia!important;--subtitle-font:Minecraftia!important}body{--dna-font-family-base:Minecraftia!important;--dna-font-family-header:Minecraftia!important}.examen-widget,.title,h2,h3{font:var(--st-font-family-secondary)!important}.main-menu .caption:not(#st-start-header-title-wrapper *),.main-menu li.submenu.ng-scope>a,.main-menu li>a,.st-title:not(#st-start-header-title-wrapper *){font-size:small}dna-button{color:var(--st-contrast-accent)}.menu-host{margin-left:-90px;padding-left:90px;width:calc(240px + 90px)}.menu-host.collapsed-menu{width:calc(64px + 90px)}.appbar-host{z-index:1;background:0 0}.logo .logo-expanded.ng-scope{content:url(https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/themeassets/minecraft/magister.webp)!important;scale:1.2!important;margin:21px!important;padding-bottom:15px!important}.logo-collapsed{content:url(https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/themeassets/minecraft/m.webp)!important;padding-bottom:15px!important}#st-cc,#st-start-today-view-popover,#st-widgets,.ng-isolate-scope .content-container{background:url(https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/themeassets/minecraft/dirt.webp)!important}#aanwezigheid thead,#st-cb,#st-cc-open,#st-start-today-view,#st-start-fab,#st-widget-grades,.appbar .menu-button,.appbar>div>a:not(.st-metric),.block h3,.main-menu a,.st-button.icon,.st-button.segment.st-dropdown-segment,dna-button-bar[slot=actions]>*,dna-button-group[slot=actions]>*,input[type=checkbox]+label>span{cursor:pointer;overflow:hidden;white-space:nowrap;user-select:none;border-radius:0;background:url('https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/themeassets/minecraft/button.png') center/cover #999;image-rendering:pixelated;border:2px solid #000;box-shadow:inset -2px -4px #0004,inset 2px 2px #fff5!important}.appbar>div>a:not(.st-metric){border:none}.st-button.icon{box-sizing:content-box}#st-start-fab,#st-widget-grades,.st-button.segment.st-dropdown-segment.active{background:url('https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/themeassets/minecraft/buttonoff.png') center/cover #999}.appbar .menu-button>*{border-radius:0!important}#aanwezigheid thead *{background-color:transparent!important;border-color:none!important}#aanwezigheid :not(.fold) thead,#aanwezigheid thead:hover,.block h3:hover,.block:not(.fold) h3,.main-menu a:hover{border:2px solid #fff!important;text-shadow:2px 2px #202013CC!important}.block h3{border:2px solid #000!important;text-shadow:none!important}.main-menu li.active>a,.main-menu li.active>a:active,.main-menu li.active>a:hover,.main-menu li.submenu.ng-scope.active>a,.main-menu li.submenu.ng-scope.active>a:active,.main-menu li.submenu.ng-scope.active>a:hover,.main-menu li.submenu.ng-scope>a:active,.main-menu li>a:active{border:2px solid #fff;text-shadow:2px 2px #202013CC!important;font-size:small}ul.tabs li::after{background-color:transparent}input[type=checkbox]:checked+label>span{cursor:pointer;overflow:hidden;white-space:nowrap;user-select:none;border-radius:0;background:url('https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/themeassets/minecraft/button.png') center/cover #999;image-rendering:pixelated;border:2px solid #fff!important;box-shadow:inset -2px -4px #0004,inset 2px 2px #fff5!important;text-shadow:2px 2px #202013CC!important}.block .content,.fancy-select .k-multiselect-wrap.k-floatwrap,.fancy-select .k-widget.k-multiselect.k-header.select.all-items-selected,.fancy-select .k-widget.k-multiselect.k-header.select.all-items-selected.k-state-hover,.tabsheet .block,.tabsheet .block .content{background-color:transparent!important;border:none!important}.block .content fieldset{background-color:var(--st-background-secondary)!important}.widget.ng-scope .block h3 b{font-size:large;position:absolute;left:50%;top:50%;translate:-50% -50%}#st-start-fab{background-color:var(--st-background-secondary);padding:8px!important}#st-start-fab>*{color:#fff}#st-widget-digitalclock:hover{background-color:#4d3828!important}#faux-label{left:145px!important}`
        },
    ]
})

const applyPreset = () => {
    if (!selectedThemeId.value) return
    const theme = store.value.themes.find(t => t.id === selectedThemeId.value)

    // Apply theme settings
    Object.entries(theme).forEach(([key, val]) => {
        if (propertyKeys.includes(key)) syncedStorage[key] = val
    })

    // Save to local storage
    localStorage.value.storedThemes = {
        ...localStorage.value.storedThemes,
        [theme.id]: theme
    }

    selectedThemeId.value = null
}
</script>

<template>
    <div class="options-category">
        <Dialog v-model:active="importDialog">
            <template #icon>format_paint</template>
            <template #headline>Thema importeren</template>
            <template #text>
                Weet je zeker dat je "{{store.themes.find(t => t.id === selectedThemeId)?.name}}" wilt importeren?
                Dit overschrijdt je huidige instellingen.
            </template>
            <template #buttons>
                <button class="primary" @click="applyPreset(); importDialog = false">Importeren</button>
                <button @click="importDialog = false">Annuleren</button>
            </template>
        </Dialog>

        <div id="personal-presets">
            <TransitionGroup name="list">
                <button v-for="preset in store.themes" class="theme-preset" :key="preset.id" :title="preset.name">
                    <MagisterThemePreview class="theme-preset-preview" :preset="preset" :scale="1.2" />
                    <div class="theme-preset-info">
                        <span class="theme-preset-name">{{ preset.name }}</span>
                        <span class="theme-preset-author">Door {{ preset.author }}</span>
                    </div>
                    <div class="theme-actions">
                        <a @click.stop="selectedThemeId = preset.id; importDialog = true;" title="Inladen">
                            <Icon>file_export</Icon>
                        </a>
                    </div>
                </button>
            </TransitionGroup>
            <p v-if="store.themes.length === 0" style="text-align: center;">
                De theme store is leeg! <br />
                Kom later terug
            </p>
        </div>
    </div>
</template>

<style scoped>
/* Behoud de bestaande styling */
.options-category {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 56px 1fr;
    height: 100%;
    overflow: hidden;
}

#personal-presets {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin: 8px;
}

.theme-preset {
    position: relative;
    display: flex;
    gap: 12px;
    padding: 8px;
    background-color: var(--color-surface-container);
    border: none;
    border-radius: 12px;
    cursor: pointer;
}

.theme-preset-preview {
    height: 60px;
    aspect-ratio: 16/9;
    border-radius: 8px;
    outline: 1px solid var(--color-outline-variant);
    overflow: hidden;
}

.theme-preset-info {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;
    text-align: start;
}

.theme-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
}
</style>