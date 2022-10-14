document.querySelectorAll('.bind').forEach(async element => {
    let value = await setting(element.id)
    console.log(element.id, setting(element.id), value)
    switch (element.getAttribute('type')) {
        case 'checkbox':
            element.checked = value
            element.addEventListener('change', event => {
                set(event.target.id, event.target.checked)
            })
            break

        default:
            element.value = value
            element.addEventListener('change', event => {
                set(event.target.id, event.target.value)
            })
            break
    }
})

function setting(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], (result) => {
            let value = Object.values(result)[0]
            value ? resolve(value) : resolve('')
        })
    })
}

function set(key, value) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, resolve())
    })
}