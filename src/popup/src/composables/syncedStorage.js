/* eslint-disable */

import { ref, onMounted, watchEffect } from 'vue'

export function useSyncedStorage() {
    let syncedStorage = ref({})

    onMounted(() => {
        if (chrome?.storage?.sync)
            chrome.storage.sync.get()
                .then(value => syncedStorage.value = value)
    })

    watchEffect(() => {
        if (chrome?.storage?.sync)
            chrome.storage.sync.set(syncedStorage.value)
    })

    return syncedStorage
}