let syncedStorage = {},
    apiUserId,
    apiUserToken,
    apiCache = {}

let eggs = [],
    announcements = [];

(async () => {
    if (chrome?.storage) syncedStorage = await getFromStorageMultiple(null, 'sync', true)
})()

window.addEventListener('DOMContentLoaded', async () => {

    const snackbarWrapper = element('div', 'st-snackbars', document.body)

    handleAnnouncements()

    setTimeout(() => {
        saveToStorage('usedExtension', chrome.runtime.getManifest().version, 'local')
    }, 500)
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
                let timestamp = start.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' })
                if (start <= now && end >= now) {
                    // Start date is in the past and End date is in the future
                    timestamp = 'nu'
                } else if (start >= now) {
                    // Start date is in the future
                    if (start - now < minToMs(15)) timestamp = 'zometeen'
                    else if (start.isToday()) timestamp = `vandaag om ${start.getFormattedTime()}`
                    else if (start.isTomorrow()) timestamp = `morgen om ${start.getFormattedTime()}`
                    else if (start - now < daysToMs(5)) timestamp = `${start.getFormattedDay()} om ${start.getFormattedTime()}`
                    else if (start - now < daysToMs(90)) timestamp = `week ${start.getWeek()}, ${start.getFormattedDay()}`
                    else timestamp = start.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                } else if (end <= now) {
                    // End date is in the past
                    if (now - end < minToMs(5)) timestamp = 'zojuist'
                    else if (now - end < minToMs(15)) timestamp = 'een paar minuten geleden'
                    else if (end.isToday()) timestamp = `vandaag om ${end.getFormattedTime()}`
                    else if (end.isYesterday()) timestamp = `gisteren om ${end.getFormattedTime()}`
                    else if (now - end < daysToMs(5)) timestamp = `afgelopen ${end.getFormattedDay()}`
                    else if (now.getFullYear() !== end.getFullYear()) timestamp = end.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
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

Date.prototype.isTomorrow = function (offset = 0) { return this > midnight(0 + offset) && this < midnight(1 + offset) }
Date.prototype.isToday = function (offset = 0) { return this > midnight(-1 + offset) && this < midnight(0 + offset) }
Date.prototype.isYesterday = function (offset = 0) { return this > midnight(-2 + offset) && this < midnight(-1 + offset) }

Array.prototype.random = function () {
    const arr = this
    const random = arr[Math.floor(Math.random() * arr.length)]
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
            break

        case 'dialog':
            return new Promise(resolve => {
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

                dialog.addEventListener('close', () => { resolve() }, { once: true })
            })

        default:
            break
    }

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