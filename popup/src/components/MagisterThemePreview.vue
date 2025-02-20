<script setup>
import { computed, inject } from 'vue'
import { presets, propertyKeys } from '../../public/themePresets.js'

const props = defineProps(['preset'])

const syncedStorage = inject('syncedStorage')

const currentTheme = computed(() => {
    let currentTheme = {}
    if (props.preset) propertyKeys.forEach(key => currentTheme[key] = (props.preset?.[key] || presets[0][key]))
    else propertyKeys.forEach(key => currentTheme[key] = syncedStorage.value[key])
    return currentTheme
})

const style = computed(() => ({
    colorScheme: (currentTheme.value['ptheme']?.split(',')?.[0] || 'auto'),
    accentColor: (currentTheme.value['ptheme'] || 'auto,207,95,55')?.split(',').slice(1),
    pageColor: currentTheme.value['pagecolor']?.startsWith('true')
        ? `hsl(${currentTheme.value['pagecolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null,
    appbarColor: currentTheme.value['appbarcolor']?.startsWith('true')
        ? `hsl(${currentTheme.value['appbarcolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null,
    menubarColor: currentTheme.value['sidecolor']?.startsWith('true')
        ? `hsl(${currentTheme.value['sidecolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null,
    wallpaperOpacity: currentTheme.value['wallpaper-opacity'],
    wallpaperUrl: currentTheme.value['wallpaper']?.startsWith('custom')
        ? currentTheme.value['wallpaper'].replace('custom,', '')
        : null,
    decoration: currentTheme.value['decoration']?.split(',')[0] !== 'none'
        ? currentTheme.value['decoration']?.split(',')[0]
        : null,
    decorationUrl: currentTheme.value['decoration']?.startsWith('custom')
        ? currentTheme.value['decoration'].replace('custom,', '')
        : null,
    shape: currentTheme.value['shape'] ?? 8,
}))

function presetMatches(preset) {
    const fallbackPreset = presets[0]

    // Return true if every property matches the preset (or, if it doesn't exist, the fallback preset)
    return propertyKeys.every(key => currentTheme.value[key] === (preset?.[key] ?? fallbackPreset[key]))
}
</script>

<template>
    <img id="theme-preview" v-if="props.preset?.thumbnail || presets.find(presetMatches)?.thumbnail" class="image"
        :src="props.preset?.thumbnail || presets.find(presetMatches)?.thumbnail"
        :title="'Dit is een voorbeeld van je thema. Het kan zijn dat \nhet thema er net anders uitziet dan hier.'" />
    <ThemePreviewImage v-else id="theme-preview" class="composition" :style="style"
        :title="props.preset?.name ? 'Dit is een voorbeeld van je thema. Het kan zijn dat \nhet thema er net anders uitziet dan hier.' : (currentTheme['custom-css'] || currentTheme['custom-css']) ? 'Dit is een voorbeeld van je thema. Aangepaste CSS werkt niet in dit \nvoorbeeld, dus het kan zijn dat je thema er anders uitziet dan hier.' : 'Dit is een voorbeeld van je thema.'" />
</template>

<style></style>

<style scoped>
#theme-preview.image {
    overflow: hidden;
    width: 100%;
    height: 100%;
}
</style>