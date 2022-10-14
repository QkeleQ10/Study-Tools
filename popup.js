document.querySelectorAll('.bind').forEach(element => {
    switch (element.getAttribute('type')) {
        case 'checkbox':
            element.checked = get(element.id)
            element.addEventListener('change', event => {
                set(event.target.id, event.target.checked)
            })
            break

        default:
            element.value = get(element.id)
            element.addEventListener('change', event => {
                set(event.target.id, event.target.value)
            })
            break
    }
})

function get(key) {
    chrome.storage.local.get(['key'], (result) => {
        console.log(key, result.key)
        return result.key
    })
}

function set(key, value) {
    console.log(`assigned to SET ${key} to ${value}`)
    chrome.storage.local.set({ key: value }, () => {
        console.log(key, value)
        return value || undefined
    })
}