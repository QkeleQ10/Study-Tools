let syncedStorage = {},
    verbose = false,
    apiUserId,
    apiUserToken,
    apiCache = {}

let eggs = [],
    announcements = [],
    snackbarQueue = [];

(async () => {
    if (chrome?.storage) syncedStorage = await getFromStorageMultiple(null, 'sync', true)
    verbose = syncedStorage['verbosity']
})()

window.addEventListener('DOMContentLoaded', async () => {
    handleAnnouncements()
})

async function handleAnnouncements() {
    let response = await fetch(`https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/announcements.json`)
    if (!response.ok) return
    announcements = Object.values(await response.json())

    announcements
        .filter(announcement => announcement.type === 'snackbar' || announcement.type === 'dialog')
        .forEach(async announcement => {
            if (await isAnnouncementValid(announcement)) {
                notify(announcement.type || 'snackbar', announcement.body, announcement.buttons, announcement.duration || 10000)
                if (announcement.showOnceId) setTimeout(() => {
                    saveToStorage(`announcement-${announcement.showOnceId}`, true, 'local')
                }, 5000)
            }
        })
}

function isAnnouncementValid(announcement) {
    return new Promise(async (resolve, reject) => {
        let now = new Date()

        if (announcement.requiredSettings && !announcement.requiredSettings.every(setting => syncedStorage[setting])) resolve(false)
        if (announcement.onlyForSchools && !announcement.onlyForSchools.includes(await getFromStorage('schoolName', 'local'))) resolve(false)
        if (announcement.dateStart && (new Date(announcement.dateStart) > now)) resolve(false)
        if (announcement.dateEnd && (new Date(announcement.dateEnd) < now)) resolve(false)
        if (announcement.onlyOnWeekdays && !announcement.onlyOnWeekdays.includes(now.getDay())) resolve(false)
        if (announcement.onlyBeforeTime && (new Date(`${now.toDateString()} ${announcement.onlyBeforeTime}`) < now)) resolve(false)
        if (announcement.onlyAfterTime && (new Date(`${now.toDateString()} ${announcement.onlyAfterTime}`) > now)) resolve(false)
        if (announcement.showOnceId && (await getFromStorage(`announcement-${announcement.showOnceId}`, 'local') || false)) resolve(false)

        resolve(true)
    })
}

// TODO: ugly code
// Output eggs
fetch(`https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/eggs.json`)
    .then(response => {
        if (!response.ok) return
        response.json()
            .then(data => {
                eggs = data
            })
    })

/**
 * 
 * @param {TimerHandler} func 
 * @param {number} [interval]
 */
function setIntervalImmediately(func, interval) {
    func()
    return setInterval(func, interval)
}

/**
 * Creates an element if it doesn't exist already and applies the specified properties to it.
 * @param {string} [tagName] The element's tag name
 * @param {string} [id] The element's ID
 * @param {HTMLElement} [parent] The element's parent
 * @param {Object} [attributes] The attributes to assign to the element
 * @param {string} [attributes.innerText] The element's inner text
 * @returns {HTMLElement} The created element.
 */
function element(tagName, id, parent, attributes) {
    let elem = id ? document.getElementById(id) : undefined
    if (!elem) {
        elem = document.createElement(tagName)
        if (id) elem.id = id
        if (parent) parent.append(elem)
        if (attributes) elem.setAttributes(attributes)
    } else {
        if (attributes) elem.setAttributes(attributes)
    }
    return elem
}

/**
 * 
 * @param {string} querySelector 
 * @param {boolean} [all=false] 
 * @param {number} [duration=10000] 
 * @returns 
 */
function awaitElement(querySelector, all = false, duration = 10000) {
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
        }, duration)
    })
}

/**
 * 
 * @param {string} key 
 * @param {'sync'|'local'|'session'} [location='sync'] 
 * @returns {*} Value
 */
function getFromStorage(key, location = 'sync') {
    return new Promise((resolve, reject) => {
        chrome.storage[location].get([key], (result) => {
            let value = Object.values(result)[0]
            value ? resolve(value) : resolve('')
        })
    })
}

/**
 * 
 * @param {string[]} [array] 
 * @param {'sync'|'local'|'session'} [location='sync'] 
 * @param {boolean} [all=false] 
 * @returns {object} Key-value pairs
 */
function getFromStorageMultiple(array, location = 'sync', all = false) {
    return new Promise((resolve, reject) => {
        chrome.storage[location].get(all ? null : array.map(e => [e]), (result) => {
            result ? resolve(result) : reject(Error('None found'))
        })
    })
}

function saveToStorage(key, value, location) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].set({ [key]: value }, resolve())
    })
}

Element.prototype.setAttributes = function (attributes) {
    const elem = this
    for (var key in attributes) {
        if (key === 'innerText') elem.innerText = attributes[key]
        else if (key === 'innerHTML') elem.innerHTML = attributes[key]
        else if (key === 'viewBox') elem.setAttributeNS(null, 'viewBox', attributes[key])
        else elem.setAttribute(key, attributes[key])
    }
}

// Elements with a temporal binding are updated every second, or whenever the function is invoked manually.
function updateTemporalBindings() {
    let elementsWithTemporalBinding = document.querySelectorAll('[data-temporal-type]')
    elementsWithTemporalBinding.forEach(element => {

        let networkTime = new Date(new Date() - (timeOffset || 0)),
            type = element.dataset.temporalType,
            start = new Date(element.dataset.temporalStart || networkTime),
            end = new Date(element.dataset.temporalEnd || element.dataset.temporalStart || networkTime)

        switch (type) {
            case 'timestamp':
                let timestamp = start.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'long' })
                if (start <= networkTime && end >= networkTime) {
                    // Start date is in the past and End date is in the future
                    timestamp = 'nu'
                } else if (start >= networkTime) {
                    // Start date is in the future
                    if (start - networkTime < minToMs(15)) timestamp = 'zometeen'
                    else if (start.isToday()) timestamp = `vandaag om ${start.getFormattedTime()}`
                    else if (start.isTomorrow()) timestamp = `morgen om ${start.getFormattedTime()}`
                    else if (start - networkTime < daysToMs(5)) timestamp = `${start.getFormattedDay()} om ${start.getFormattedTime()}`
                    else if (start - networkTime < daysToMs(90)) timestamp = `week ${start.getWeek()}, ${start.getFormattedDay()}`
                    else timestamp = start.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                } else if (end <= networkTime) {
                    // End date is in the past
                    if (networkTime - end < minToMs(5)) timestamp = 'zojuist'
                    else if (networkTime - end < minToMs(15)) timestamp = 'een paar minuten geleden'
                    else if (end.isToday()) timestamp = `vandaag om ${end.getFormattedTime()}`
                    else if (end.isYesterday()) timestamp = `gisteren om ${end.getFormattedTime()}`
                    else if (networkTime - end < daysToMs(5)) timestamp = `afgelopen ${end.getFormattedDay()}`
                    else if (networkTime.getFullYear() !== end.getFullYear()) timestamp = end.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                }
                element.innerText = timestamp
                break

            case 'style-hours':
                element.style.setProperty('--relative-start', networkTime.getHoursWithDecimals())
                break

            case 'ongoing-check':
                element.dataset.ongoing = (start <= networkTime && end >= networkTime)
                break

            case 'style-progress':
                let progress = (networkTime - start) / (end - start)
                element.style.setProperty('--progress', Math.min(Math.max(0, progress), 1))
                element.dataset.done = progress >= 1
                break

            case 'current-time-long':
                element.innerText = networkTime.toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam', hours: '2-digit', minutes: '2-digit', seconds: '2-digit' })
                break

            case 'current-time-short':
                element.innerText = networkTime.toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam', hours: '2-digit', minutes: '2-digit', timeStyle: 'short' })
                break

            case 'current-time-disclaimer':
                if (timeZoneDifference === 0) return element.style.display = 'none'
                else element.style.removeProperty('style')
                element.innerText = timeZoneDifference > 0
                    ? `Tijd in Nederland (${timeZoneDifference} uur later)`
                    : `Tijd in Nederland (${-timeZoneDifference} uur eerder)`
                break

            default:
                break
        }
    })
}

let timeOffset = 0
let timeZoneDifference = 0
fetch('https://worldtimeapi.org/api/timezone/Europe/Amsterdam')
    .then(response => response.json())
    .then(data => {
        timeOffset = (new Date(data?.datetime) - new Date()) || 0 // timeOffset is the difference between the system time and the network time.
        let amsterdamTimeZoneOffset = (parseInt(data?.datetime.slice(-5, -3), 10) * 60 +
            parseInt(data?.datetime.slice(-2), 10)) * -1
        timeZoneDifference = ((new Date().getTimezoneOffset() - amsterdamTimeZoneOffset) / 60)
    })
setIntervalImmediately(updateTemporalBindings, 500)

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

Date.prototype.getFormattedTime = function () { return this.toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit' }) }
Date.prototype.getHoursWithDecimals = function () { return this.getHours() + (this.getMinutes() / 60) }

Date.prototype.isTomorrow = function (offset = 0) { return this > midnight(0 + offset) && this < midnight(1 + offset) }
Date.prototype.isToday = function (offset = 0) { return this > midnight(-1 + offset) && this < midnight(0 + offset) }
Date.prototype.isYesterday = function (offset = 0) { return this > midnight(-2 + offset) && this < midnight(-1 + offset) }

Array.prototype.random = function (seed) {
    let randomValue = Math.random()
    if (seed) {
        let rand = sfc32(seed[0], seed[1], seed[2], seed[3])
        randomValue = rand()
    }
    const arr = this
    const random = arr[Math.floor(randomValue * arr.length)]
    return random
}

Array.prototype.mode = function () {
    const arr = this
    if (arr.length < 1) return undefined
    else return [...arr].sort((a, b) =>
        arr.filter(v => v === a).length
        - arr.filter(v => v === b).length
    ).at(-1)
}


Element.prototype.createBarChart = function (frequencyMap = {}, labels = {}, threshold, sort = true, rotateHue = true) {
    const chartArea = this
    if (!chartArea.classList.contains('st-bar-chart')) chartArea.innerText = ''
    chartArea.classList.remove('st-pie-chart', 'st-line-chart')
    chartArea.classList.add('st-bar-chart', 'st-chart')

    const totalFrequency = Object.values(frequencyMap).reduce((acc, frequency) => acc + frequency, 0)
    threshold ??= totalFrequency / 40
    const remainingItems = Object.entries(frequencyMap).filter(([key, frequency]) => frequency < threshold && frequency > 0)
    const remainderFrequency = remainingItems.reduce((acc, [key, frequency]) => acc + frequency, 0)
    const maxFrequency = Math.max(...Object.values(frequencyMap), remainderFrequency)

    const filteredFrequencyMap = Object.entries(frequencyMap).filter(a => a[1] >= threshold)
    if (sort) filteredFrequencyMap.sort((a, b) => b[1] - a[1])

    filteredFrequencyMap.forEach(([key, frequency], i) => {
        const hueRotate = rotateHue ? (20 * i) : 0

        const col = element('div', `${chartArea.id}-${key}`, chartArea, {
            class: 'st-bar-chart-col',
            title: labels?.[key] ?? key,
            'data-value': frequency,
            'data-percentage': Math.round(frequency / totalFrequency * 100),
            'data-y-tight': (frequency / maxFrequency * (chartArea.clientHeight - 48)) <= 28,
            style: `--hue-rotate: ${hueRotate}; --bar-fill-amount: ${frequency / maxFrequency}`
        }),
            bar = element('div', `${chartArea.id}-${key}-bar`, col, {
                class: 'st-bar-chart-bar'
            })
    })

    if (remainderFrequency > 0) {
        const hueRotate = rotateHue ? (20 * filteredFrequencyMap.length) : 0

        const col = element('div', `${chartArea.id}-remainder`, chartArea, {
            class: 'st-bar-chart-col',
            title: remainingItems.length === 1
                ? labels?.[remainingItems[0][0]] ?? remainingItems[0][0]
                : "Overige",
            'data-value': remainderFrequency,
            'data-percentage': Math.round(remainderFrequency / totalFrequency * 100),
            'data-y-tight': (remainderFrequency / maxFrequency * (chartArea.clientHeight - 48)) <= 28,
            style: `--hue-rotate: ${hueRotate}; --bar-fill-amount: ${remainderFrequency / maxFrequency}`
        }),
            bar = element('div', `${chartArea.id}-remainder-bar`, col, {
                class: 'st-bar-chart-bar'
            })
    }

    return chartArea
}

Element.prototype.createPieChart = function (frequencyMap = {}, labels = {}, threshold, rotateHue = true) {
    const chartArea = this
    chartArea.innerText = ''
    chartArea.classList.remove('st-bar-chart', 'st-line-chart')
    chartArea.classList.add('st-pie-chart', 'st-chart')

    const aboutWrapper = element('div', `${chartArea.id}-about`, chartArea, { class: 'st-chart-about' }),
        aboutLabel = element('span', `${chartArea.id}-about-label`, aboutWrapper, { class: 'st-chart-label' }),
        aboutMore = element('span', `${chartArea.id}-about-more`, aboutWrapper, { class: 'st-chart-info' })

    const totalFrequency = Object.values(frequencyMap).reduce((acc, frequency) => acc + frequency, 0)
    threshold ??= totalFrequency / 40
    const remainingItems = Object.entries(frequencyMap).filter(([key, frequency]) => frequency < threshold && frequency > 0)
    const remainderFrequency = remainingItems.reduce((acc, [key, frequency]) => acc + frequency, 0)

    const filteredAndSortedFrequencyMap = Object.entries(frequencyMap).filter(a => a[1] >= threshold).sort((a, b) => b[1] - a[1])

    filteredAndSortedFrequencyMap.forEach(([key, frequency], i, a) => {
        const pieOffset = a.slice(0, i).reduce((acc, [key, frequency]) => acc + frequency, 0) / totalFrequency,
            pieSize = frequency / totalFrequency,
            hueRotate = rotateHue ? (20 * i) : 0

        const slice = element('div', `${chartArea.id}-${key}`, chartArea, {
            class: 'st-pie-chart-slice',
            'data-key': key,
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
            hueRotate = rotateHue ? (20 * filteredAndSortedFrequencyMap.length) : 0

        const slice = element('div', `${chartArea.id}-remainder`, chartArea, {
            class: 'st-pie-chart-slice',
            'data-key': 'remainder',
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

    function updateAbout() {
        let hoveredElement = chartArea.querySelector('.st-pie-chart-slice:has(:hover), .st-pie-chart-slice:hover')
        if (!chartArea.classList.contains('donut')) hoveredElement ||= chartArea.querySelector('.st-pie-chart-slice:nth-child(2)')
        chartArea.querySelectorAll('.st-pie-chart-slice.active').forEach(element => element.classList.remove('active'))
        if (!hoveredElement) return
        hoveredElement.classList.add('active')

        let key, frequency
        if (!hoveredElement?.dataset.key || !hoveredElement?.dataset.value) {
            [key, frequency] = filteredAndSortedFrequencyMap[0]
        } else {
            [key, frequency] = [hoveredElement.dataset.key, hoveredElement.dataset.value]
        }

        if (key === 'remainder') {
            aboutLabel.innerText = "Overige"
            aboutMore.innerText = remainingItems.map(([key, frequency]) => `${key}: ${frequency}× (${Math.round(frequency / totalFrequency * 1000) / 10}%)`).join('\n')
        } else {
            aboutLabel.innerText = labels?.[key] || key
            aboutMore.innerText = `${labels?.[key] ? key + '\n' : ''}${frequency}× (${Math.round(frequency / totalFrequency * 1000) / 10}%)`
        }
    }
    chartArea.addEventListener('mousemove', updateAbout)
    chartArea.addEventListener('mouseout', updateAbout)
    updateAbout()

    return chartArea
}

Element.prototype.createLineChart = function (values = [], labels = [], minValue, maxValue) {
    const chartArea = this
    if (!chartArea.classList.contains('st-line-chart')) chartArea.innerText = ''
    chartArea.classList.remove('st-pie-chart', 'st-bar-chart')
    chartArea.classList.add('st-line-chart', 'st-chart')

    minValue ??= Math.min(...values)
    maxValue ??= Math.max(...values)

    values.forEach((value, i) => {
        const hueRotate = 10 * i

        const col = element('div', `${chartArea.id}-${i}`, chartArea, {
            class: 'st-line-chart-col',
            title: `${labels?.[i] ?? i}\n${value}`,
            'data-delta': values[i - 1] > value ? 'fall' : values[i - 1] < value ? 'rise' : values[i - 1] === value ? 'equal' : 'none',
            style: `--hue-rotate: ${hueRotate}; --point-height: ${(value - minValue) / (maxValue - minValue)}; --previous-point-height: ${((values[i - 1] || value) - minValue) / (maxValue - minValue)}`
        }),
            bar = element('div', `${chartArea.id}-${i}-bar`, col, {
                class: 'st-line-chart-point'
            })
    })

    chartArea.querySelectorAll(`.st-line-chart-col:not(:nth-child(-n+${values.length}))`).forEach(e => e.remove())

    return chartArea
}

async function notify(type = 'snackbar', body = 'Notificatie', buttons = [], duration = 4000) {
    switch (type) {
        case 'snackbar':
            const snackbar = { id: new Date().getTime(), body, buttons, duration: Math.min(Math.max(500, duration), 10000) }
            snackbarQueue.push(snackbar)
            if (!document.querySelector('.st-snackbar')) showSnackbar(snackbar)
            break

        case 'dialog':
            return new Promise(resolve => {
                const dialog = element('dialog', null, document.body, { class: 'st-dialog', innerText: body })
                dialog.showModal()

                if (buttons?.length > 0) {
                    const buttonsWrapper = element('div', null, dialog, { class: 'st-button-wrapper' })
                    buttons.forEach(item => {
                        const button = element('button', null, buttonsWrapper, { ...item, class: 'st-button tertiary' })
                        if (item.innerText) button.innerText = item.innerText
                        if (item.clickSelector) {
                            button.addEventListener('click', event => {
                                document.querySelector(item.clickSelector)?.click()
                                event.stopPropagation()
                            })
                        } else if (item.href) {
                            button.addEventListener('click', event => {
                                window.open(item.href, '_blank').focus()
                                event.stopPropagation()
                            })
                        } else button.addEventListener('click', event => event.stopPropagation())
                    })
                }

                const dialogDismiss = element('button', null, dialog, { class: 'st-button icon st-dialog-dismiss', innerText: '', title: "Dialoogvenster verbergen" })
                dialogDismiss.addEventListener('click', () => {
                    dialog.close()
                    dialog.remove()
                })

                dialog.addEventListener('close', () => { resolve() }, { once: true })
            })

        default:
            break
    }
}

function showSnackbar(object) {
    const { id, body, buttons, duration } = object
    snackbarQueue.splice(snackbarQueue.findIndex(item => item.id === id), 1)

    const snackbar = element('div', `st-snackbar-${id}`, document.body, { class: 'st-snackbar', innerText: body })

    if (buttons?.length > 0) {
        const buttonsWrapper = element('div', null, snackbar, { class: 'st-button-wrapper' })
        buttons.forEach(item => {
            const button = element('button', null, buttonsWrapper, { ...item, class: 'st-button tertiary' })
            if (item.innerText) button.innerText = item.innerText
            if (item.clickSelector) {
                button.addEventListener('click', event => {
                    document.querySelector(item.clickSelector)?.click()
                    event.stopPropagation()
                })
            } else if (item.expandToDialog) {
                button.addEventListener('click', event => {
                    notify('dialog', item.expandToDialog)
                    event.stopPropagation()
                })
            } else if (item.href) {
                button.addEventListener('click', event => {
                    window.open(item.href, '_blank').focus()
                    event.stopPropagation()
                })
            } else button.addEventListener('click', event => event.stopPropagation())
        })
    }

    const snackbarDismiss = element('button', null, snackbar, { class: 'st-button icon st-snackbar-dismiss', innerText: '', title: "Melding verbergen" })
    snackbarDismiss.addEventListener('click', () => {
        if (!snackbar?.parentElement) return
        snackbar.classList.add('hiding')
        setTimeout(() => {
            if (!snackbar?.parentElement) return
            snackbar.remove()
            if (snackbarQueue[0]) showSnackbar(snackbarQueue[0])
        }, 200)
    })
    setTimeout(() => {
        if (!snackbar?.parentElement) return
        snackbar.classList.add('hiding')
        setTimeout(() => {
            if (!snackbar?.parentElement) return
            snackbar.remove()
            if (snackbarQueue[0]) showSnackbar(snackbarQueue[0])
        }, 200)
    }, duration)
}

function createStyle(content, id) {
    return new Promise((resolve, reject) => {
        let styleElem
        if (!id) {
            styleElem = document.createElement('style')
        } else {
            styleElem = document.querySelector(`style#${id}`) || document.createElement('style')
            styleElem.id = id
        }
        styleElem.textContent = content
        document.head.append(styleElem)
        resolve(styleElem)
    })
}

// Seeded random numbers.
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}
function sfc32(a, b, c, d) {
    return function () {
        a |= 0; b |= 0; c |= 0; d |= 0;
        var t = (a + b | 0) + d | 0;
        d = d + 1 | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}