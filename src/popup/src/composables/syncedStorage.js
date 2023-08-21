/* eslint-disable */
import { ref, onMounted, watchEffect } from 'vue'

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
                            if (!syncedStorage.value[setting.id] || typeof syncedStorage.value[setting.id] === 'undefined') {
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
        if (chrome?.storage?.sync) {
            chrome.storage.sync.set(syncedStorage.value)
        }
        if (chrome?.tabs) {
            chrome.tabs.query({}, (tabs) => {
                if (!tabs) return
                tabs.forEach((tab) => {
                    if (!tab) return
                    chrome.tabs.sendMessage(tab.id, { type: 'styles-updated' })
                })
            })
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