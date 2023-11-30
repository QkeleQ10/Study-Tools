let syncedStorage = {},
    apiUserId,
    apiUserToken,
    apiCache = {}

let eggs = []

prepareStorage()
async function prepareStorage() {
    if (chrome?.storage) syncedStorage = await getFromStorageMultiple(null, 'sync', true)
}

window.addEventListener('DOMContentLoaded', async () => {

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

        const res = await fetch(url.replace(/(\$USERID)/gi, apiUserId), { headers: { Authorization: apiUserToken }, ...options })

        // Catch any errors
        if (!res.ok) {
            if (res.status === 429) notify('snackbar', `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
            else {
                // If it's not a ratelimit, retry one more time.
                await getApiCredentials()

                const res = await fetch(url.replace(/(\$USERID)/gi, apiUserId), { headers: { Authorization: apiUserToken }, ...options })
                if (!res.ok) {
                    if (res.status === 429) notify('snackbar', `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
                    else {
                        notify('snackbar', `Er is iets misgegaan. Gebruik alsjeblieft de knop hiernaast om dit te melden. Fout ${res.status} bij ${res.url}.`, [{ innerText: "e-mail", href: `mailto:quinten@althues.nl` }], 36000000)
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

// Elements with a temporal binding are updated every 10 seconds, or whenever the function is invoked manually.
function updateTemporalBindings() {
    let elementsWithTemporalBinding = document.querySelectorAll('[data-temporal-type]')
    elementsWithTemporalBinding.forEach(element => {

        let now = new Date(),
            type = element.dataset.temporalType,
            start = new Date(element.dataset.temporalStart || now),
            end = new Date(element.dataset.temporalEnd || element.dataset.temporalStart || now)

        switch (type) {
            case 'timestamp':
                let timestamp = `week ${start.getWeek()}, ${start.getFormattedDay()}`
                if (start <= now && end >= now) {
                    // Start date is in the past and End date is in the future
                    timestamp = 'nu'
                } else if (start >= now) {
                    // Start date is in the future
                    if (start - now < minToMs(15)) timestamp = 'zometeen'
                    else if (start.isToday()) timestamp = `vandaag om ${start.getFormattedTime()}`
                    else if (start.isTomorrow()) timestamp = `morgen om ${start.getFormattedTime()}`
                    else if (start - now < daysToMs(5)) timestamp = `${start.getFormattedDay()} om ${start.getFormattedTime()}`
                } else if (end <= now) {
                    // End date is in the past
                    if (now - end < minToMs(5)) timestamp = 'zojuist'
                    else if (now - end < minToMs(15)) timestamp = 'een paar minuten geleden'
                    else if (end.isToday()) timestamp = `vandaag om ${start.getFormattedTime()}`
                    else if (end.isYesterday()) timestamp = `gisteren om ${start.getFormattedTime()}`
                    else if (now - end < daysToMs(5)) timestamp = `afgelopen ${start.getFormattedDay()} om ${start.getFormattedTime()}`
                }
                element.innerText = timestamp
                break

            case 'style-hours':
                element.style.setProperty('--relative-start', now.getHoursWithDecimals())
                break

            case 'ongoing-check':
                element.dataset.ongoing = (start <= now && end >= now)
                break

            case 'style-progress':
                let progress = (now - start) / (end - start)
                element.style.setProperty('--progress', Math.min(Math.max(0, progress), 1))
                element.dataset.done = progress >= 1
                break

            case 'current-time-long':
                element.innerText = now.toLocaleTimeString('nl-NL', { hours: '2-digit', minutes: '2-digit', seconds: '2-digit' })
                break

            case 'current-time-short':
                element.innerText = now.toLocaleTimeString('nl-NL', { hours: '2-digit', minutes: '2-digit', timeStyle: 'short' })
                break

            default:
                break
        }

    })
}
setIntervalImmediately(updateTemporalBindings, 1000)

let minToMs = (minutes = 1) => minutes * 60000
let daysToMs = (days = 1) => days * 8.64e7

let midnight = (offset = 0) => {
    const date = new Date()
    date.setDate(date.getDate() + offset)
    date.setHours(23, 59, 59, 999)
    return date
}

Date.prototype.getWeek = function () {
    let d = this
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)),
        weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return weekNo
}

Date.prototype.getFormattedDay = function () {
    let d = this
    const weekDays = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
    return weekDays[d.getDay()]
}

Date.prototype.getFormattedTime = function () { return this.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) }
Date.prototype.getHoursWithDecimals = function () { return this.getHours() + (this.getMinutes() / 60) }

Date.prototype.isTomorrow = function () { return this > midnight(0) && this < midnight(1) }
Date.prototype.isToday = function () { return this > midnight(-1) && this < midnight(0) }
Date.prototype.isYesterday = function () { return this > midnight(-2) && this < midnight(-1) }

Element.prototype.createBarChart = function (frequencyMap, labels, threshold = 1) {
    const chartArea = this
    chartArea.innerText = ''
    chartArea.classList.add('st-bar-chart', 'st-chart')

    const totalFrequency = Object.values(frequencyMap).reduce((acc, frequency) => acc + frequency, 0)
    const remainingItems = Object.entries(frequencyMap).filter(([key, frequency]) => frequency < threshold && frequency > 0)
    const remainderFrequency = remainingItems.reduce((acc, [key, frequency]) => acc + frequency, 0)
    const maxFrequency = Math.max(...Object.values(frequencyMap), remainderFrequency)

    Object.entries(frequencyMap).filter(a => a[1] >= threshold).sort((a, b) => b[1] - a[1]).forEach(([key, frequency]) => {
        const col = element('div', `${chartArea.id}-${key}`, chartArea, {
            class: 'st-bar-chart-col',
            title: labels?.[key] ?? key,
            'data-value': frequency,
            'data-percentage': Math.round(frequency / totalFrequency * 100),
            style: `--bar-fill-amount: ${frequency / maxFrequency}`
        }),
            bar = element('div', `${chartArea.id}-${key}-bar`, col, {
                class: 'st-bar-chart-bar'
            })
    })

    if (remainderFrequency > 0) {
        const col = element('div', `${chartArea.id}-remainder`, chartArea, {
            class: 'st-bar-chart-col',
            title: remainingItems.length === 1
                ? labels?.[remainingItems[0][0]] ?? remainingItems[0][0]
                : "Overige",
            'data-value': remainderFrequency,
            'data-percentage': Math.round(remainderFrequency / totalFrequency * 100),
            style: `--bar-fill-amount: ${remainderFrequency / maxFrequency}`
        }),
            bar = element('div', `${chartArea.id}-remainder-bar`, col, {
                class: 'st-bar-chart-bar'
            })
    }

    return chartArea
}

Element.prototype.createPieChart = function (frequencyMap, labels, threshold = 1) {
    const chartArea = this
    chartArea.innerText = ''
    chartArea.classList.add('st-pie-chart', 'st-chart')

    const totalFrequency = Object.values(frequencyMap).reduce((acc, frequency) => acc + frequency, 0)
    const remainingItems = Object.entries(frequencyMap).filter(([key, frequency]) => frequency < threshold && frequency > 0)
    const remainderFrequency = remainingItems.reduce((acc, [key, frequency]) => acc + frequency, 0)

    const filteredAndSortedFrequencyMap = Object.entries(frequencyMap).filter(a => a[1] >= threshold).sort((a, b) => b[1] - a[1])

    filteredAndSortedFrequencyMap.forEach(([key, frequency], i, a) => {
        const pieOffset = a.slice(0, i).reduce((acc, [key, frequency]) => acc + frequency, 0) / totalFrequency,
            pieSize = frequency / totalFrequency,
            hueRotate = 20 * i

        const slice = element('div', `${chartArea.id}-${key}`, chartArea, {
            class: 'st-pie-chart-slice',
            title: labels?.[key] ?? key,
            'data-value': frequency,
            'data-percentage': Math.round(frequency / totalFrequency * 100),
            'data-more-than-half': pieSize > 0.5,
            style: `--hue-rotate: ${hueRotate}; --pie-offset: ${pieOffset}; --pie-size: ${pieSize}`
        }),
            box1 = element('div', `${chartArea.id}-${key}-box1`, slice, {
                class: 'st-pie-chart-arc st-pie-chart-slice-box1'
            }),
            box2 = element('div', `${chartArea.id}-${key}-box2`, box1, {
                class: 'st-pie-chart-arc st-pie-chart-slice-box2'
            })
    })

    if (remainderFrequency > 0) {
        const pieOffset = 1 - (remainderFrequency / totalFrequency),
            pieSize = remainderFrequency / totalFrequency,
            hueRotate = 20 * filteredAndSortedFrequencyMap.length

        const slice = element('div', `${chartArea.id}-remainder`, chartArea, {
            class: 'st-pie-chart-slice',
            title: remainingItems.length === 1
                ? labels?.[remainingItems[0][0]] ?? remainingItems[0][0]
                : "Overige",
            'data-value': remainderFrequency,
            'data-percentage': Math.round(remainderFrequency / totalFrequency * 100),
            'data-more-than-half': pieSize > 0.5,
            style: `--hue-rotate: ${hueRotate}; --pie-offset: ${pieOffset}; --pie-size: ${pieSize}`
        }),
            box1 = element('div', `${chartArea.id}-remainder-box1`, slice, {
                class: 'st-pie-chart-arc st-pie-chart-slice-box1'
            }),
            box2 = element('div', `${chartArea.id}-remainder-box2`, box1, {
                class: 'st-pie-chart-arc st-pie-chart-slice-box2'
            })
    }

    // if mouse is inside the bounding box of box1 and box2, apply a class or sth

    return chartArea
}

async function notify(type = 'snackbar', body = 'Notificatie', buttons = [], duration = 4000) {
    switch (type) {
        case 'snackbar':
            const snackbar = document.createElement('div'),
                snackbarWrapper = await awaitElement('#st-snackbars')
            snackbarWrapper.append(snackbar)
            snackbar.innerText = body

            if (buttons?.length > 0) buttons.forEach(element => {
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