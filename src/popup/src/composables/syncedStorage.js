/* eslint-disable */

import { ref, onMounted } from 'vue'

export function useSyncedStorage() {
    let syncedStorage = ref({})

    onMounted(async () => {
        if (!chrome) return
        syncedStorage.value = await chrome.storage.sync.get()
    })

    return syncedStorage
}