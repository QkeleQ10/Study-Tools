chrome.runtime.sendMessage({ action: 'popstateDetected' }) // Revive the service worker

let syncedStorage,
    // @ts-ignore
    localStorage,
    locale = 'nl-NL',
    i18nData = {},
    i18nDataNl = {},
    verbose = false,
    apiUserId,
    apiUserToken,
    apiCache = {};

let eggs = [],
    announcements = [],
    snackbarQueue = [];

const dates = {
    get now() { return new Date() },
    get today() { return midnight() },
    get tomorrow() { return midnight(null, 1) },
    get gatherStart() { return midnight(null, -7) },
    get gatherEarlyStart() { return midnight(null, -42) },
    get gatherEnd() { return midnight(null, 42) },
};

async function initialiseStorage() {
    return new Promise(async (resolve, reject) => {
        if (chrome?.storage) {
            const syncedStorageData = await getFromStorageMultiple(null, 'sync', true);
            const localStorageData = await getFromStorageMultiple(null, 'local', true);

            syncedStorage = new Proxy(syncedStorageData, {
                set(target, property, value) {
                    target[property] = value;
                    saveToStorage(property, value, 'sync');
                    return true;
                }
            });

            localStorage = new Proxy(localStorageData, {
                set(target, property, value) {
                    target[property] = value;
                    saveToStorage(property, value, 'local');
                    return true;
                }
            });

            if (chrome?.runtime) {
                locale = syncedStorage['language'];
                if (!['nl-NL', 'en-GB', 'fr-FR', 'de-DE', 'sv-SE', 'la-LA'].includes(locale)) locale = 'nl-NL';
                const req = await fetch(chrome.runtime.getURL(`src/strings/${locale.split('-')[0]}.json`));
                i18nData = await req.json();
                const reqNl = await fetch(chrome.runtime.getURL(`src/strings/nl.json`));
                i18nDataNl = await reqNl.json();
            }

            resolve();
        } else reject();

        verbose = syncedStorage['verbosity'];
    });
}
initialiseStorage();

/**
 * 
 * @param {Function} func 
 * @param {number} [interval]
 */
function setIntervalImmediately(func, interval) {
    func()
    return setInterval(func, interval)
}

/**
 * @typedef {Object} CreateElementAttributes
 * @property {string} [id] - The element's ID.
 * @property {string} [innerText] - The element's inner text.
 * @property {Object|string} [style] - The element's style.
 */

/**
 * Creates an element if it doesn't exist already and applies the specified properties to it.
 *
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tagName - The element's tag name.
 * @param {HTMLElement} [parent] - The element's parent.
 * @param {CreateElementAttributes & Record<string, any>} [attributes] - The attributes to assign to the element.
 * @returns {HTMLElementTagNameMap[K]} The created or updated element.
 */
function createElement(tagName, parent, attributes = {}) {
    /** @type {HTMLElementTagNameMap[K] | null} */
    let element = attributes.id ? /** @type {any} */ (document.getElementById(attributes.id)) : null;

    if (!element) {
        element = document.createElement(tagName);
    }

    element.setAttributes(attributes);
    if (parent) parent.append(element);
    return element;
}
function element(tagName, id, parent, attributes) {
    return createElement(tagName, parent, { id, ...attributes })
}

HTMLElement.prototype.createChildElement = function (tagName, attributes) {
    return createElement(tagName, this, attributes)
}

HTMLElement.prototype.createSiblingElement = function (tagName, attributes) {
    return createElement(tagName, this.parentElement, attributes)
}

HTMLElement.prototype.setAttributes = function (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
        if (value == null) continue;
        if (['innerText', 'textContent', 'innerHTML', 'outerHTML'].includes(key)) this[key] = value;
        else if (key === 'viewBox') this.setAttributeNS(null, 'viewBox', value);
        else if (key === 'style' && typeof value === 'object')
            Object.entries(value).forEach(([k, v]) =>
                /^[a-z]+([A-Z][a-z]*)*$/.test(k) ? this.style[k] = v : this.style.setProperty(k, v));
        else if (key === 'dataset' && typeof value === 'object')
            Object.assign(this.dataset, value);
        else if (key === 'classList')
            Array.isArray(value) ? this.classList.add(...value) : this.classList.add(...value.split(' '));
        else this.setAttribute(key, value);
    }
}

const parseBoolean = (value) =>
    value === 'true' || value === true ? true
        : value === 'false' || value === false ? false
            : null

/**
 * Wait for an element to be available in the DOM.
 * @param {string} querySelector 
 * @param {boolean} [all=false] 
 * @param {number} [duration=10000] 
 * @returns 
 */
function awaitElement(querySelector, all = false, duration = 10000, quiet = false) {
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
            if (!quiet) console.warn("Could not find element: ", querySelector, all, duration)
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
        if (location === 'session' && !chrome.storage.session) location = 'local'
        chrome.storage[location].get([key], (result) => {
            let value = Object.values(result || {})[0]
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
        if (location === 'session' && !chrome.storage.session) location = 'local'
        chrome.storage[location].get(all ? null : array.map(e => [e]), (result) => {
            result ? resolve(result) : reject(Error('None found'))
        })
    })
}

function saveToStorage(key, value, location) {
    return new Promise((resolve, reject) => {
        if (location === 'session' && !chrome.storage.session) location = 'local'
        chrome.storage[location ? location : 'sync'].set({ [key]: value }, resolve())
    })
}

function formatTimestamp(start, end, now, includeTime) {
    now ??= new Date()
    start ??= end ?? now
    end ??= start ?? now
    let timestamp = start.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'long' })
    if (start <= now && end >= now) {
        // Start date is in the past and End date is in the future
        i18n('dates.now')
    } else if (start >= now) {
        // Start date is in the future
        if (start - now < minToMs(15)) timestamp =
            i18n('dates.soon')
        else if (start.isToday()) timestamp =
            i18n(includeTime ? 'dates.todayAtTime' : 'dates.today', { time: start.getFormattedTime() })
        else if (start.isTomorrow()) timestamp =
            i18n(includeTime ? 'dates.tomorrowAtTime' : 'dates.tomorrow', { time: start.getFormattedTime() })
        else if (start - now < daysToMs(5)) timestamp =
            i18n(includeTime ? 'dates.weekdayAtTime' : 'dates.nextWeekday', { weekday: start.getFormattedDay(), time: start.getFormattedTime() })
        else if (start - now < daysToMs(90)) timestamp =
            i18n('dates.weekdayInWeek', { weekday: start.getFormattedDay(), week: start.getWeek() })
        else timestamp =
            start.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    } else if (end <= now) {
        // End date is in the past
        if (now - end < minToMs(5)) timestamp =
            i18n('dates.justNow')
        else if (now - end < minToMs(15)) timestamp =
            i18n('dates.fewMinsAgo')
        else if (end.isToday()) timestamp =
            i18n(includeTime ? 'dates.todayAtTime' : 'dates.today', { time: end.getFormattedTime() })
        else if (end.isYesterday()) timestamp =
            i18n(includeTime ? 'dates.yesterdayAtTime' : 'dates.yesterday', { time: end.getFormattedTime() })
        else if (now - end < daysToMs(5)) timestamp =
            i18n('dates.lastWeekday', { weekday: end.getFormattedDay() })
        else if (now.getFullYear() !== end.getFullYear()) timestamp =
            end.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    }

    return timestamp
}

let minToMs = (minutes = 1) => minutes * 60000
let daysToMs = (days = 1) => days * 8.64e7

function midnight(targetDate, offset = 0) {
    let date;
    if (targetDate instanceof Date) {
        date = new Date(targetDate);
        date.setDate(targetDate.getDate() + offset);
    } else {
        date = new Date();
        date.setDate(date.getDate() + offset);
    }
    date.setHours(0, 0, 0, 0);
    return date;
}

Date.prototype.getWeek = function () {
    let d = this
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)),
        weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return weekNo
}

Date.prototype.getHoursWithDecimals = function () { return this.getHours() + (this.getMinutes() / 60) }

Date.prototype.getFormattedDay = function () {
    let d = this
    const weekDays = i18nArray('dates.weekdays')
    return weekDays[d.getDay()]
}

Date.prototype.getFormattedTime = function () { return this.toLocaleTimeString(locale, { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit' }) }

Date.prototype.addDays = function (days) {
    let date = new Date(this)
    date.setDate(date.getDate() + days)
    return date
}

Date.prototype.isToday = function (offset = 0) { return this >= midnight(null, offset) && this < midnight(null, 1 + offset) }
Date.prototype.isTomorrow = function () { return this.isToday(1) }
Date.prototype.isYesterday = function () { return this.isToday(-1) }

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

class Dropdown {
    element;

    constructor(element = document.createElement('button'), options = {}, selectedOption = '', onChange, onClick) {
        this.element = element;
        this.element.classList.add('st-dropdown');
        this.options = options;
        this.selectedOption = selectedOption;
        this.onChange = onChange;
        this.onClick = onClick;

        this.dropdownPopover = document.body.createChildElement('div', { id: this.element.id ? `${this.element.id}-popover` : null, class: 'st-dropdown-popover' });
        this.dropdownPopover.innerText = '';

        this.render();

        this.element.addEventListener('click', (event) => {
            if (!this.dropdownPopover.classList.contains('st-visible')) event.stopPropagation();
            const rect = this.element.getBoundingClientRect();
            this.dropdownPopover.setAttribute('style', `top: ${rect.top + rect.height + 8}px; right: ${window.innerWidth - rect.right}px;`);
            this.dropdownPopover.classList.remove('st-hidden');
            this.dropdownPopover.classList.add('st-visible');
            this.element.classList.add('active');

            this.dropdownPopover.style.bottom = (window.innerHeight - this.dropdownPopover.getBoundingClientRect().bottom) < 100 ? '15px' : 'auto';

            window.addEventListener('click', () => {
                setTimeout(() => {
                    this.dropdownPopover.classList.remove('st-visible');
                    this.dropdownPopover.classList.add('st-hidden');
                    this.element.classList.remove('active');
                }, 5);
            }, { once: true });
        });
    }

    render() {
        this.element.innerText = '';
        this.element.dataset.clickFunction = this.onClick ? 'true' : 'false';

        this.selectedOptionElement = this.element.createChildElement(this.onClick ? 'button' : 'div', {
            class: 'st-dropdown-current',
            innerText: this.options[this.selectedOption]?.replace(i18n('sw.hideStudyguide'), i18n('sw.hidden'))
        });

        if (this.onClick) {
            this.selectedOptionElement.addEventListener('click', event => {
                if (!this.dropdownPopover.classList.contains('st-visible')) event.stopPropagation();
                this.changeValue(this.onClick(this.selectedOption));
            });
        }

        this.dropdownPopover.innerText = '';
        for (const key in this.options) {
            if (key === 'divider') {
                this.dropdownPopover.createChildElement('div', {
                    class: 'st-line horizontal'
                });
            } else if (Object.hasOwnProperty.call(this.options, key)) {
                const title = this.options[key];
                const optionElement = this.dropdownPopover.createChildElement('button', {
                    class: 'st-button segment st-dropdown-segment',
                    innerText: title,
                    'data-key': key
                });

                if (this.selectedOption === key) optionElement.classList.add('active');
                else optionElement.classList.remove('active');

                optionElement.addEventListener('click', event => {
                    this.changeValue(key);
                });
            }
        }

        if (this.dropdownPopover.firstElementChild) {
            (this.dropdownPopover.firstElementChild instanceof HTMLElement) && this.dropdownPopover.firstElementChild.focus();
        }
    }

    changeValue(newValue) {
        this.onChange?.(newValue);
        this.selectedOption = newValue;
        this.selectedOptionElement.innerText = this.options[this.selectedOption].replace(i18n('sw.hideStudyguide'), i18n('sw.hidden'));
        this.dropdownPopover.querySelectorAll('.st-dropdown-segment').forEach(e => {
            const el = /** @type {HTMLElement} */ (e);
            if (this.selectedOption === el.dataset.key) el.classList.add('active');
            else el.classList.remove('active');
        });
    }
}

HTMLElement.prototype.createBarChart = function (frequencyMap = {}, labels = {}, threshold, sort = true, rotateHue = true, showRemainder = true, itemCap = 100) {
    const chartArea = this
    if (!chartArea.classList.contains('st-bar-chart')) chartArea.innerText = ''
    chartArea.classList.remove('st-pie-chart', 'st-line-chart')
    chartArea.classList.add('st-bar-chart', 'st-chart')

    const totalFrequency = Object.values(frequencyMap).reduce((acc, frequency) => acc + frequency, 0)
    threshold ??= totalFrequency / 40
    const remainingItems = Object.entries(frequencyMap).filter(([key, frequency]) => frequency < threshold && frequency > 0)
    const remainderFrequency = remainingItems.reduce((acc, [key, frequency]) => acc + frequency, 0)
    const maxFrequency = Math.max(...Object.values(frequencyMap), showRemainder ? remainderFrequency : 0)

    let filteredFrequencyMap = Object.entries(frequencyMap).filter(a => a[1] >= threshold)
    if (sort) filteredFrequencyMap.sort((a, b) => b[1] - a[1])
    filteredFrequencyMap = filteredFrequencyMap.slice(0, itemCap)

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

    if (remainderFrequency > 0 && showRemainder) {
        const hueRotate = rotateHue ? (20 * filteredFrequencyMap.length) : 0

        const col = element('div', `${chartArea.id}-remainder`, chartArea, {
            class: 'st-bar-chart-col',
            title: remainingItems.length === 1
                ? labels?.[remainingItems[0][0]] ?? remainingItems[0][0]
                : i18n('remainder'),
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

HTMLElement.prototype.createPieChart = function (frequencyMap = {}, labels = {}, threshold, rotateHue = true) {
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
        const hoveredHTMLElement = /** @type {HTMLElement} */ (hoveredElement);
        if (!hoveredHTMLElement?.dataset.key || !hoveredHTMLElement?.dataset.value) {
            [key, frequency] = filteredAndSortedFrequencyMap[0]
        } else {
            [key, frequency] = [hoveredHTMLElement.dataset.key, hoveredHTMLElement.dataset.value]
        }

        if (key === 'remainder') {
            aboutLabel.innerText = i18n('remainder')
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

HTMLElement.prototype.createLineChart = function (values = [], labels = [], minValue, maxValue, showProgressiveMean = false) {
    const chartArea = this
    if (!chartArea.classList.contains('st-line-chart')) chartArea.innerText = ''
    chartArea.classList.remove('st-pie-chart', 'st-bar-chart')
    chartArea.classList.add('st-line-chart', 'st-chart')

    minValue ??= Math.min(...values)
    maxValue ??= Math.max(...values)

    let progressiveMean = values[0]

    values.forEach((value, i) => {
        const hueRotate = 10 * i

        const progressiveMeanPrev = progressiveMean
        progressiveMean = calculateMean(values.slice(0, i + 1))

        const col = element('div', `${chartArea.id}-${i}`, chartArea, {
            class: 'st-line-chart-col',
            title: `${labels?.[i] ?? i}\n${value.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}\n\nVoortschrijdend gemiddelde: ${progressiveMean.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            'data-delta': values[i - 1] > value
                ? 'fall'
                : values[i - 1] < value
                    ? 'rise' : values[i - 1] === value
                        ? 'equal'
                        : 'none',
            'data-mean-delta': !showProgressiveMean || i === 0
                ? 'none'
                : progressiveMeanPrev > progressiveMean
                    ? 'fall'
                    : progressiveMeanPrev < progressiveMean
                        ? 'rise'
                        : Math.abs((progressiveMean - progressiveMeanPrev) / (maxValue - minValue)) < 0.2
                            // : progressiveMeanPrev === progressiveMean
                            ? 'equal'
                            : 'none',
            style: `--hue-rotate: ${hueRotate}; --point-height: ${(value - minValue) / (maxValue - minValue)}; --previous-point-height: ${((values[i - 1] || value) - minValue) / (maxValue - minValue)}; --mean-height: ${(progressiveMean - minValue) / (maxValue - minValue)}; --previous-mean-height: ${(progressiveMeanPrev - minValue) / (maxValue - minValue)};`
        }),
            bar = element('div', `${chartArea.id}-${i}-bar`, col, {
                class: 'st-line-chart-point'
            })
    })

    chartArea.querySelectorAll(`.st-line-chart-col:not(:nth-child(-n+${values.length}))`).forEach(e => e.remove())

    return chartArea
}

async function notify(type = 'snackbar', body = 'Notificatie', buttons = [], duration = 4000, options = {}) {
    switch (type) {
        case 'snackbar':
            const snackbar = { id: new Date().getTime(), body, buttons, duration: Math.min(Math.max(500, duration), 60000) }
            snackbarQueue.push(snackbar)
            if (!document.querySelector('.st-snackbar')) showSnackbar(snackbar)
            else document.querySelector('.st-snackbar').classList.add('queued')
            break

        case 'dialog':
            return new Promise(resolve => {
                const dialog = element('dialog', null, document.body, { class: 'st-dialog' })
                const dialogBody = element('div', null, dialog, { class: 'st-dialog-body', innerText: body })
                dialog.showModal()

                const buttonsWrapper = element('div', null, dialog, { class: 'st-button-wrapper' })
                if (buttons?.length > 0) {
                    buttons.forEach(item => {
                        const button = element('button', null, buttonsWrapper, { ...item, class: `st-button ${item.primary ? 'primary' : 'tertiary'}` })
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
                        } else if (item.callback || item.onclick) {
                            button.addEventListener('click', event => {
                                if (item.callback) item.callback(event)
                                if (item.onclick) item.onclick(event)
                                event.stopPropagation()
                            })
                        } else button.addEventListener('click', event => event.stopPropagation())
                    })
                }

                if (typeof options.allowClose === 'boolean' && options.allowClose === false) {
                    dialog.addEventListener('cancel', (event) => {
                        event.preventDefault()
                    })
                    resolve(dialog)
                } else {
                    const dialogDismiss = element('button', null, buttonsWrapper, { class: 'st-button st-dialog-dismiss', 'data-icon': options.closeIcon || '', innerText: options.closeText || i18n('close') })
                    if (options?.index && options?.length) {
                        dialogDismiss.classList.add('st-step')
                        dialogDismiss.innerText = `${options.index} / ${options.length}`
                        if (options.index !== options.length) dialogDismiss.dataset.icon = ''
                    }
                    dialogDismiss.addEventListener('click', () => {
                        dialog.close()
                        dialog.remove()
                    })
                }

                dialog.addEventListener('close', () => {
                    resolve()
                }, { once: true })
            })

        default:
            break
    }
}

class Dialog {
    element;
    body;
    #buttonsWrapper;

    constructor(options = {}) {
        this.element = createElement('dialog', document.body, { class: 'st-dialog' });
        this.body = createElement('div', this.element, { class: 'st-dialog-body', innerText: options.innerText || '' });

        this.#buttonsWrapper = createElement('div', this.element, { class: 'st-button-wrapper' });
        if (options?.buttons?.length > 0) {
            options.buttons.forEach(item => {
                const button = createElement('button', this.#buttonsWrapper, { ...item, class: `st-button ${item.primary ? 'primary' : 'tertiary'}` });
                if (item.innerText) button.innerText = item.innerText;
                if (item.clickSelector) {
                    button.addEventListener('click', event => {
                        document.querySelector(item.clickSelector)?.click();
                        event.stopPropagation();
                    });
                } else if (item.href) {
                    button.addEventListener('click', event => {
                        window.open(item.href, '_blank').focus();
                        event.stopPropagation();
                    });
                } else if (item.callback || item.onclick) {
                    button.addEventListener('click', event => {
                        if (item.callback) item.callback(event);
                        if (item.onclick) item.onclick(event);
                        event.stopPropagation();
                    });
                } else button.addEventListener('click', event => event.stopPropagation());
            });
        }

        if (options.allowClose === false) {
            this.element.addEventListener('cancel', (event) => {
                event.preventDefault();
            });
        } else {
            const dialogDismiss = createElement('button', this.#buttonsWrapper, { class: 'st-button st-dialog-dismiss', 'data-icon': options.closeIcon || '', innerText: options.closeText || i18n('close') });
            if (options?.index && options?.length) {
                dialogDismiss.classList.add('st-step');
                dialogDismiss.innerText = `${options.index} / ${options.length}`;
                if (options.index !== options.length) dialogDismiss.dataset.icon = '';
            }
            dialogDismiss.addEventListener('click', () => this.close());

            this.element.addEventListener('click', (event) => {
                if (
                    event.target instanceof Element &&
                    !event.target.closest('.st-dialog-body') &&
                    !event.target.closest('.st-button-wrapper')
                ) {
                    this.close();
                }

            });
        }
    }

    show() {
        this.element.showModal();
    }

    close(maintain = false) {
        this.element.close?.();
        if (!maintain) setTimeout(() => this.element.remove(), 200);
    }

    on(event, callback) {
        return new Promise(resolve => {
            this.element.addEventListener(event, (e) => {
                resolve(e);
                callback(e);
            }, { once: !callback });
        });
    }
}

function showSnackbar(object) {
    const { id, body, buttons, duration } = object
    snackbarQueue.splice(snackbarQueue.findIndex(item => item.id === id), 1)

    const snackbar = element('div', `st-snackbar-${id}`, document.body, { class: 'st-snackbar', innerText: body })

    if (buttons?.[0] && buttons?.forEach) {
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
    let styleElem
    if (!id) {
        styleElem = document.createElement('style')
    } else {
        styleElem = document.querySelector(`style#${id}`) || document.createElement('style')
        styleElem.id = id
    }
    styleElem.textContent = content
    document.head.append(styleElem)
    return styleElem
}

/**
 * Internationalization function to retrieve localized strings.
 * @param {string} key - The key for the translation string, using dot notation for nested keys.
 * @param {Object} [variables={}] - Variables to replace in the translation string.
 * @param {boolean} [useDefaultLanguage=false] - Whether to use the default language data.
 * @param {boolean} [fallBackToNull=false] - Whether to fall back to null if not found.
 * @returns {string}
 */
function i18n(key, variables = {}, useDefaultLanguage = false, fallBackToNull = false) {
    if (!(key.length > 0)) return ''

    const keys = key.split('.')
    let value = useDefaultLanguage ? i18nDataNl : i18nData

    for (const k of keys) {
        value = value[k]
        if (!value) value = fallBackToNull ? null : useDefaultLanguage ? key : i18n(key, variables, true)
    }

    if (value) {
        for (const variableName in variables) {
            if (Object.hasOwnProperty.call(variables, variableName)) {
                const variableContent = variables[variableName]
                value = value.replace(new RegExp(`{${variableName}}`, 'g'), variableContent)
            }
        }
    }

    return typeof value === 'string' ? value : ''
}

/**
 * Internationalization function to retrieve localized strings.
 * @param {string} key - The key for the translation string, using dot notation for nested keys.
 * @param {Object} [variables={}] - Variables to replace in the translation string.
 * @param {boolean} [useDefaultLanguage=false] - Whether to use the default language data.
 * @param {boolean} [fallBackToNull=false] - Whether to fall back to null if not found.
 * @returns {string[]}
 */
function i18nArray(key, variables = {}, useDefaultLanguage = false, fallBackToNull = false) {
    if (!(key.length > 0)) return []

    const keys = key.split('.')
    let value = useDefaultLanguage ? i18nDataNl : i18nData

    for (const k of keys) {
        value = value[k]
        if (!value) value = fallBackToNull ? null : useDefaultLanguage ? key : i18n(key, variables, true)
    }

    if (value) {
        for (const variableName in variables) {
            if (Object.hasOwnProperty.call(variables, variableName)) {
                const variableContent = variables[variableName]
                value = value.replace(new RegExp(`{${variableName}}`, 'g'), variableContent)
            }
        }
    }

    return Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
}

function formatOrdinals(number, feminine) {
    if (locale.startsWith('la')) {
        return romanize(number)
    }

    const pr = new Intl.PluralRules(locale, { type: 'ordinal' })

    const suffixes = {
        'nl-NL': new Map([
            ['other', 'e']
        ]),
        'en-GB': new Map([
            ['one', 'st'],
            ['two', 'nd'],
            ['few', 'rd'],
            ['other', 'th'],
        ]),
        'fr-FR': new Map([
            ['zero', 'e'],
            ['one', feminine ? 're' : 'er'],
            ['other', 'e'],
        ]),
        'de-DE': new Map([
            ['other', '.']
        ]),
        'sv-SE': new Map([
            ['one', ':a'],
            ['other', ':e']
        ])
    }

    const rule = pr.select(number)
    const suffix = suffixes[locale]?.get(rule) || suffixes[locale]?.get('other') || '.'
    return `${number}${suffix}`
}

function romanize(num) {
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
            "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
            "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
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