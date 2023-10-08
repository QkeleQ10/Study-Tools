let syncedStorage = {},
    apiUserId,
    apiUserToken,
    apiCache = {}

let eggs = []

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
    if (!response.ok) return
    let data = await response.json()

    Object.keys(data).forEach(async key => {
        let value = data[key]

        if (value.requiredSettings && !value.requiredSettings.every(setting => syncedStorage[setting])) return
        if (value.onlyForSchools && !value.onlyForSchools.includes(await getFromStorage('schoolName', 'local'))) return
        if (value.dateStart && (new Date(value.dateStart) > new Date())) return
        if (value.dateEnd && (new Date(value.dateEnd) < new Date())) return
        if (value.onlyOnWeekdays && !value.onlyOnWeekdays.includes(new Date().getDay())) return
        if (value.onlyBeforeTime && (new Date(`${new Date().toDateString()} ${value.onlyOnWeekdays}`) < new Date())) return
        if (value.onlyAfterTime && (new Date(`${new Date().toDateString()} ${value.onlyAfterTime}`) > new Date())) return

        notify(value.type || 'snackbar', value.body, value.buttons, value.duration || 10000)
    })
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

async function getApiCredentials() {
    apiUserId = await getFromStorage('user-id', 'local')
    apiUserToken = await getFromStorage('token', 'local')
    return new Promise(async (resolve, reject) => {
        let req = await chrome.runtime.sendMessage({ action: 'getCredentials' })
        apiUserId = req.apiUserId
        apiUserToken = req.apiUserToken
        resolve({ apiUserId, apiUserToken })
    })
}

// Wrapper for fetch().json() with caching
async function useApi(url, options) {
    return new Promise(async (resolve, reject) => {
        // If the cached result is less than 20 seconds old, use it!
        if (apiCache[url] && (new Date() - apiCache[url].date) < 20000) {
            resolve(apiCache[url])
            return
        }

        // Otherwise, start a new request.
        await getApiCredentials()

        const res = await fetch(url.replace('$USERID', apiUserId), { headers: { Authorization: apiUserToken }, ...options })

        // Catch any errors
        if (!res.ok) {
            if (res.status === 429) notify('snackbar', `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
            else {
                // If it's not a ratelimit, retry one more time.
                notify('snackbar', `Fout ${res.status}`, null, 1000)

                await getApiCredentials()

                const res = await fetch(url.replace('$USERID', apiUserId), { headers: { Authorization: apiUserToken }, ...options })
                if (!res.ok) {
                    if (res.status === 429) notify('snackbar', `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
                    else {
                        notify('snackbar', "Er is iets misgegaan. Deze update is nog gloednieuw en het kan zijn dat het me niet is gelukt om alle foutjes eruit te halen. Geef me alsjeblieft even een seintje!", { innerText: "e-mail", href: 'mailto:quinten@althues.nl' }, 36000000)
                        if (apiCache[url]) {
                            notify('snackbar', `Fout ${res.status}\nGegevens zijn mogelijk verouderd`)
                            return resolve(apiCache[url])
                        }
                        else {
                            notify('snackbar', `Fout ${res.status}\nVernieuw de pagina en probeer het opnieuw`)
                            return reject(res.status)
                        }
                    }
                } else {
                    const json = await res.json()
                    resolve({ ...json, date: new Date() })
                    // Cache the result and include the date
                    apiCache[url] = { ...json, date: new Date() }
                }
            }

            // Continue if no errors
        } else {
            const json = await res.json()
            resolve(json)
            // Cache the result and include the date
            apiCache[url] = { ...json, date: new Date() }
        }

    })
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

// TODO: Write something actually nice for this...
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

function getWeekNumber(d = new Date()) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)),
        weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return weekNo
}

async function notify(type = 'snackbar', body = 'Notificatie', buttons = [], duration = 4000) {
    switch (type) {
        case 'snackbar':
            const snackbar = document.createElement('div'),
                snackbarWrapper = await awaitElement('#st-snackbars')
            snackbarWrapper.append(snackbar)
            snackbar.innerText = body

            buttons.forEach(element => {
                let a = document.createElement('a')
                snackbar.append(a)
                setAttributes(a, element)
                if (element.innerText) a.innerText = element.innerText
                if (element.clickSelector) {
                    a.addEventListener('click', event => {
                        document.querySelector(element.clickSelector)?.click()
                        event.stopPropagation()
                    })
                }
                else a.addEventListener('click', event => event.stopPropagation())
            })
            const snackbarDismiss = element('button', null, snackbar, { class: 'st-button icon snackbar-dismiss', innerText: '' })
            snackbarDismiss.addEventListener('click', () => {
                snackbar.classList.remove('open')
                setTimeout(() => snackbar.remove(), 2000)
            })
            setTimeout(() => snackbar.classList.add('open'), 50)
            if (duration !== 0) {
                setTimeout(() => snackbar.classList.remove('open'), duration)
                setTimeout(() => snackbar.remove(), duration + 2000)
            }
            break;

        case 'dialog':
            const dialog = element('dialog', null, document.body, { class: 'st-dialog', innerText: body })
            dialog.showModal()

            if (buttons?.length > 0) {
                const buttonsWrapper = element('div', null, dialog, { class: 'st-dialog-buttons' })
                buttons.forEach(item => {
                    const button = element('button', null, buttonsWrapper, { ...item, class: 'st-button tertiary' })
                    if (item.innerText) button.innerText = item.innerText
                    if (item.clickSelector) {
                        button.addEventListener('click', event => {
                            document.querySelector(item.clickSelector)?.click()
                            event.stopPropagation()
                        })
                    }
                    else button.addEventListener('click', event => event.stopPropagation())
                })
            }

            const dialogDismiss = element('button', null, dialog, { class: 'st-button icon st-dialog-dismiss', innerText: '' })
            dialogDismiss.addEventListener('click', () => {
                dialog.close()
                dialog.remove()
            })
            break;

        default:
            break;
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