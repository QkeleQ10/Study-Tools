/* eslint-disable */
import { ref, onMounted, watchEffect, isProxy, toRaw } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import settings from '../../public/settings.js'

const browser = window.browser || window.chrome

export function useSyncedStorage() {
    let syncedStorage = ref({})

    onMounted(() => {
        console.log('mounted!')
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

    const debouncedFn = useDebounceFn(() => {
        if (browser?.storage?.sync) {
            let toStore = { ...syncedStorage.value }
            if (isProxy(toStore)) toStore = toRaw(toStore)
            browser.storage.sync.set(toStore)
        }
    }, 250, { maxWait: 2000 })

    const updateTheme = () => {
        const themeFixed = syncedStorage.value['ptheme']?.split(',')
        const themeAuto = themeFixed?.[0] === 'auto'
        let currentTheme = themeFixed

        if (themeAuto && window.matchMedia?.('(prefers-color-scheme: dark)').matches) { currentTheme[0] = 'dark' }
        else if (themeAuto) currentTheme[0] = 'light'

        document.documentElement.setAttribute('theme', (currentTheme?.[0] || 'light'))
        document.documentElement.style.setProperty('--palette-primary-hue', (currentTheme?.[1] || 207))
        document.documentElement.style.setProperty('--palette-primary-saturation', `${currentTheme?.[2] || 95}%`)
        document.documentElement.style.setProperty('--palette-primary-luminance', `${currentTheme?.[3] || 55}%`)
    }

    watchEffect(() => {
        let toStore = { ...syncedStorage.value }
        debouncedFn()
        updateTheme()
    })

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

export function useExtension() {
    let extension = ref({})

    onMounted(() => {
        extension.value = browser?.extension
    })

    return { extension }
}