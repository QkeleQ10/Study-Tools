/* eslint-disable */
import { ref, onMounted, watchEffect, isProxy, toRaw } from 'vue'

import settings from '../../../popup/public/settings.js'

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
            let toStore = {...syncedStorage.value}
            if (isProxy(toStore)) toStore = toRaw(toStore)
            browser.storage.sync.set(toStore)
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