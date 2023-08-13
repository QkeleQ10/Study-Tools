/* eslint-disable */

import { ref, onMounted } from 'vue'

export function useSyncedStorage() {
    let syncedStorage = ref({})

    onMounted(async () => {
        if (chrome) syncedStorage.value = await chrome.storage.sync.get()
    })
}