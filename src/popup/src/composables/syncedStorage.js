/* eslint-disable */

import { ref, onMounted, watchEffect } from 'vue'

export function useSyncedStorage() {
    let syncedStorage = ref({})

    onMounted(() => {
        if (chrome?.storage?.sync)
            chrome.storage.sync.get()
                .then(value => {
                    syncedStorage.value = value
                    refreshTheme()
                })
    })

    watchEffect(() => {
        if (chrome?.storage?.sync)
            chrome.storage.sync.set(syncedStorage.value)
        refreshTheme()
    })

    function refreshTheme() {
        if (syncedStorage.value.color) {
            document.documentElement.style.setProperty('--palette-primary-hue', syncedStorage.value.color.h)
            document.documentElement.style.setProperty('--palette-primary-saturation', `${syncedStorage.value.color.s}%`)
            document.documentElement.style.setProperty('--palette-primary-luminance', `${syncedStorage.value.color.l}%`)
        }
        if (syncedStorage.value.theme) {
            document.documentElement.setAttribute('theme', syncedStorage.value.theme)
            if (syncedStorage.value.theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('theme', 'auto dark')
        }
    }

    return syncedStorage
}