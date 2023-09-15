let syncedStorage = {},
    eggs = [],
    schoolName = window.location.href.includes('magister') ? window.location.hostname.split('.')[0] : undefined

window.addEventListener('DOMContentLoaded', async () => {
    if (chrome?.storage) syncedStorage = await getFromStorageMultiple(null, 'sync', true)

    const snackbarWrapper = document.createElement('div')
    snackbarWrapper.id = 'st-snackbars'
    document.body.append(snackbarWrapper)

    checkAnnouncements()

    setTimeout(() => {
        saveToStorage('usedExtension', chrome.runtime.getManifest().version, 'local')
    }, 500)
})

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

function getRelativeTimeString(date) {
    // Allow dates or times to be passed
    const timeMs = typeof date === "number" ? date : date.getTime();

    // Get the amount of seconds between the given date and now
    const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);

    // Array reprsenting one minute, hour, day, week, month, etc in seconds
    const cutoffs = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity];

    // Array equivalent to the above but in the string representation of the units
    const units = ["second", "minute", "hour", "day", "week", "month", "year"];

    // Grab the ideal cutoff unit
    const unitIndex = cutoffs.findIndex(cutoff => cutoff > Math.abs(deltaSeconds));

    // Get the divisor to divide from the seconds. E.g. if our unit is "day" our divisor
    // is one day in seconds, so we can divide our seconds by this to get the # of days
    const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1;

    // Intl.RelativeTimeFormat do its magic
    const rtf = new Intl.RelativeTimeFormat('nl-NL', { numeric: "auto" });
    return rtf.format(Math.floor(deltaSeconds / divisor), units[unitIndex]);
}

async function showSnackbar(body = 'Snackbar', duration = 4000, buttons = []) {
    const snackbar = document.createElement('div'),
        snackbarWrapper = await awaitElement('#st-snackbars')
    snackbarWrapper.append(snackbar)
    snackbar.innerText = body

    buttons.forEach(element => {
        let a = document.createElement('a')
        snackbar.append(a)
        setAttributes(a, element)
        if (element.innerText) a.innerText = element.innerText
        a.addEventListener('click', event => event.stopPropagation())
    })
    let snackbarDismiss = element('button', null, snackbar, { class: 'st-button icon snackbar-dismiss', innerText: '' })
    snackbarDismiss.addEventListener('click', () => {
        snackbar.classList.remove('open')
        setTimeout(() => snackbar.remove(), 2000)
    })
    setTimeout(() => snackbar.classList.add('open'), 50)
    if (duration === 0) {
        setTimeout(() => snackbar.classList.remove('open'), duration)
        setTimeout(() => snackbar.remove(), duration + 2000)
    }
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