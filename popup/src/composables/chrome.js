/* eslint-disable */
import { ref, onMounted, watchEffect, isProxy, toRaw } from 'vue'

import settings from '../../public/settings.js'

const browser = window.browser || window.chrome

export function useSyncedStorage() {
    let syncedStorage = ref({})

    onMounted(() => {
        if (browser?.storage?.sync) {
            browser.storage.sync.get()
                .then(value => {
                    syncedStorage.value = value

                    // Set all undefined settings to their default values
                    settings.forEach(category => {
                        category.settings.forEach(setting => {
                            if (typeof syncedStorage.value[setting.id] === 'undefined') {
                                syncedStorage.value[setting.id] = setting.default
                            }
                        })
                    })
                })

            // Store the current version number
            syncedStorage.value['v'] = browser?.runtime?.getManifest()?.version
        }
    })

    watchEffect(() => {
        if (browser?.storage?.sync) {
            let toStore = { ...syncedStorage.value }
            if (isProxy(toStore)) toStore = toRaw(toStore)
            browser.storage.sync.set(toStore)
        }
        refreshTheme()
    })

    function refreshTheme() {
        const autoTheme = syncedStorage.value['auto-theme']
        const themeFixed = syncedStorage.value['theme-fixed']?.split(',')
        const themeDay = syncedStorage.value['theme-day']?.split(',')
        const themeNight = syncedStorage.value['theme-night']?.split(',')
        let currentTheme = themeFixed

        if (autoTheme && window.matchMedia?.('(prefers-color-scheme: dark)').matches) { currentTheme = themeNight }
        else if (autoTheme) currentTheme = themeDay

        document.documentElement.setAttribute('theme', currentTheme?.[0])
        document.documentElement.style.setProperty('--palette-primary-hue', currentTheme?.[1])
        document.documentElement.style.setProperty('--palette-primary-saturation', `${currentTheme?.[2]}%`)
        document.documentElement.style.setProperty('--palette-primary-luminance', `${currentTheme?.[3]}%`)
    }

    return syncedStorage
}

export function useManifest() {
    let manifest = ref({})

    onMounted(() => {
        if (browser?.runtime?.getManifest)
            manifest.value = browser.runtime.getManifest()
    })

    return { manifest }
}