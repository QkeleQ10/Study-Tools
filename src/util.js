let syncedStorage = {},
    eggs = [],
    schoolName = window.location.href.includes('magister') ? window.location.hostname.split('.')[0] : undefined

window.addEventListener('DOMContentLoaded', async () => {
    if (chrome?.storage) syncedStorage = await getFromStorageMultiple(null, 'sync', true)

    const snackbarWrapper = document.createElement('div')
    snackbarWrapper.id = 'st-snackbars'
    document.body.append(snackbarWrapper)

    checkUpdates()
    // checkDefaults()
    checkAnnouncements()

    setTimeout(() => {
        saveToStorage('usedExtension', chrome.runtime.getManifest().version, 'local')
    }, 500)
})

async function checkUpdates(override) {
    let beta = syncedStorage['beta']
    if (override) beta = false
    if (!syncedStorage['updates']) return
    fetch(`https://raw.githubusercontent.com/QkeleQ10/Study-Tools/${beta ? 'dev' : 'main'}/manifest.json`)
        .then(async response => {
            if (response.ok) {
                let data = await response.json()
                if (data.version > chrome.runtime.getManifest().version) {
                    showSnackbar(`Nieuwe ${beta ? 'bèta' : ''}versie van Study Tools (${data.version}) beschikbaar.`, 121000, [{ innerText: "installeren", href: 'https://qkeleq10.github.io/extensions/studytools/update', target: 'blank' }])
                }
            } else console.warn("Error requesting Study Tools manifest", response)
        })
        .catch(() => {
            if (!override) checkUpdates(true)
        })

    if (syncedStorage['update-notes']) {
        fetch(`https://raw.githubusercontent.com/QkeleQ10/Study-Tools/${beta ? 'dev' : 'main'}/updates.json`)
            .then(async response => {
                if (response.ok) {
                    let data = await response.json()
                    for (const key in data) {
                        if (Object.hasOwnProperty.call(data, key) && key > await getFromStorage('usedExtension', 'local')) {
                            showSnackbar(`Nieuw in ${key}:\n${data[key]}`, 10000)
                        }
                    }
                } else console.warn("Error requesting Study Tools updates", response)
            })
    }
}

async function checkAnnouncements() {
    let response = await fetch(`https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/announcements.json`)
    if (response.ok) {
        let data = await response.json()
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                let value = data[key]
                if (value.requiredSettings && !value.requiredSettings.every(setting => syncedStorage[setting])) return
                if (value.allowedSchools && !value.allowedSchools.some(school => school === schoolName)) return
                if (value.dateStart && (new Date(value.dateStart) > new Date())) return
                if (value.dateEnd && (new Date(value.dateEnd) < new Date())) return
                showSnackbar(value.body, value.duration || 10000, value.buttons)
            }
        }
    }
}

// Output eggs
fetch(`https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/eggs.json`)
    .then(response => {
        if (!response.ok) return
        response.json()
            .then(data => {
                eggs = data
            })
    })

function setIntervalImmediately(func, interval) {
    func()
    return setInterval(func, interval)
}

function element(tagName, id, parent, attributes) {
    let elem = id ? document.getElementById(id) : undefined
    if (!elem) {
        elem = document.createElement(tagName)
        if (id) elem.id = id
        if (parent) parent.append(elem)
        if (attributes) setAttributes(elem, attributes)
    } else {
        if (attributes) setAttributes(elem, attributes)
    }
    return elem
}

function awaitElement(querySelector, all, duration) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            if (document.querySelector(querySelector)) {
                clearInterval(interval)
                clearTimeout(timeout)
                return resolve(all ? document.querySelectorAll(querySelector) : document.querySelector(querySelector))
            }
        }, 50)

        let timeout = setTimeout(() => {
            clearInterval(interval)
            console.warn("Could not find element: ", querySelector, all, duration)
            return resolve(undefined)
        }, duration || 10000)
    })
}

function getFromStorage(key, location) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].get([key], (result) => {
            let value = Object.values(result)[0]
            value ? resolve(value) : resolve('')
        })
    })
}

function getFromStorageMultiple(array, location, all) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].get(all ? null : array.map(e => [e]), (result) => {
            result ? resolve(result) : reject(Error('None found'))
        })
    })
}

function saveToStorage(key, value, location) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].set({ [key]: value }, resolve())
    })
}

function setAttributes(elem, attributes) {
    for (var key in attributes) {
        if (key === 'innerText') elem.innerText = attributes[key]
        if (key === 'innerHTML') elem.innerHTML = attributes[key]
        else elem.setAttribute(key, attributes[key])
    }
}

async function showSnackbar(body = 'Snackbar', duration = 4000, buttons = []) {
    const snackbar = document.createElement('div'),
        snackbarWrapper = await awaitElement('#st-snackbars')
    snackbarWrapper.append(snackbar)
    snackbar.innerText = body
    snackbar.addEventListener('dblclick', () => {
        snackbar.classList.remove('open')
        setTimeout(() => snackbar.remove(), 2000)
    })
    buttons.forEach(element => {
        let a = document.createElement('a')
        snackbar.append(a)
        setAttributes(a, element)
        if (element.innerText) a.innerText = element.innerText
        a.addEventListener('click', event => event.stopPropagation())
    })
    setTimeout(() => snackbar.classList.add('open'), 50)
    setTimeout(() => snackbar.classList.remove('open'), duration)
    setTimeout(() => snackbar.remove(), duration + 2000)
}

function createStyle(content, id = 'st-style') {
    return new Promise((resolve, reject) => {
        let styleElem = document.querySelector(`style#${id}`) || document.createElement('style')
        styleElem.id = id
        styleElem.textContent = content
        document.head.append(styleElem)
        resolve(styleElem)
    })
}