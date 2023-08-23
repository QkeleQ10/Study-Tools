/* eslint-disable */
import { ref, onMounted, watchEffect, isProxy, toRaw } from 'vue'

import settings from '../../../popup/public/settings.js'

export function useSyncedStorage() {
    let syncedStorage = ref({})

    onMounted(() => {
        if (chrome?.storage?.sync) {
            chrome.storage.sync.get()
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
            syncedStorage.value['openedPopup'] = chrome?.runtime?.getManifest()?.version
        }
    })

    watchEffect(() => {
        console.log('watcheffect!')
        if (chrome?.storage?.sync) {
            let toStore = {...syncedStorage.value}
            console.log(toStore)
            if (isProxy(toStore)) toStore = toRaw(toStore)
            console.log(toStore)
            chrome.storage.sync.set(toStore)
        }
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