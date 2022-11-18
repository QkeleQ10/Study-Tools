setSetting('openedPopup', true)

// Bind inputs
document.querySelectorAll('.bind').forEach(async element => {
    let value = await getSetting(element.id)
    switch (element.getAttribute('type')) {
        case 'checkbox':
            element.checked = value
            element.addEventListener('input', event => setSetting(event.target.id, event.target.checked))
            break

        default:
            element.value = value
            element.addEventListener('input', event => setSetting(event.target.id, event.target.value))
            break
    }
})

// Allbuttons
document.querySelectorAll('.allbutton').forEach(async element => {
    element.addEventListener('click', event => {
        event.target.disabled = true
        setTimeout(() => { event.target.disabled = false }, 5000)
        switch (event.target.innerText) {
            case 'Alles uit':
                event.target.parentElement.parentElement.querySelectorAll('input[type=checkbox]').forEach(e => { if (e.checked) e.click() })
                event.target.innerText = 'Alles aan'
                break

            default:
                event.target.parentElement.parentElement.querySelectorAll('input[type=checkbox]').forEach(e => { if (!e.checked) e.click() })
                event.target.innerText = 'Alles uit'
                break
        }
    })
})

function getSetting(key, type) {
    return new Promise((resolve, reject) => {
        chrome.storage[type ? type : 'sync'].get([key], (result) => {
            let value = Object.values(result)[0]
            value ? resolve(value) : resolve('')
        })
    })
}

function setSetting(key, value, type) {
    return new Promise((resolve, reject) => {
        chrome.storage[type ? type : 'sync'].set({ [key]: value }, resolve())
    })
}