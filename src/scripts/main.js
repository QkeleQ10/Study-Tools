chrome.runtime.sendMessage({ action: 'popstateDetected' }) // Revive the service worker

// Run when the extension and page are loaded
main()
async function main() {
    // if ((await getFromStorage('sampleApiData', 'session')) === 'true') MagisterApi.useSampleData = true

    const todayDate = new Date(new Date().setHours(0, 0, 0, 0))

    let appbar = await awaitElement('.appbar'),
        logos = await awaitElement('img.logo-expanded, img.logo-collapsed', true),
        key = syncedStorage['magister-overlay-hotkey'] || 'S'

    let shortcuts = Object.values(syncedStorage.shortcuts),
        spacer = await awaitElement('.appbar>.spacer')

    // Change Vandaag to Start in appbar
    if (syncedStorage['start-enabled']) {
        let vandaagText = await awaitElement('a#menu-vandaag span')
        vandaagText.innerText = "Start"
        if (Math.random() < 0.009) createStyle(`.fa-home:before { content: '' !important; }`)
        if (Math.random() < 0.004) vandaagText.innerText = "Eind"
    }

    const allMenuItemSpans = await awaitElement('.main-menu a span, .main-menu .popup-menu a', true)
    allMenuItemSpans.forEach(span => {
        span.innerText = i18n(`views.${span.innerText}`, {}, false, true) || span.innerText
    })

    document.querySelector('.menu-footer > a > span').innerText = i18n('Inklappen')

    // Appbar metrics
    let appbarMetrics = element('div', 'st-appbar-metrics', appbar)
    if (spacer) spacer.before(appbarMetrics)
    else appbar.prepend(appbarMetrics)

    // Week number indicator
    if (syncedStorage['magister-appbar-week']) {
        let appbarWeek = element('a', 'st-appbar-week', appbarMetrics, { class: 'st-metric', 'data-description': i18n('dates.week'), innerText: new Date().getWeek(), href: '#/vandaag' })
        appbarWeek.addEventListener('click', async () => {
            let weekSel = await awaitElement('#st-start-today-view>button')
            if (weekSel) weekSel.click()
        })
    }

    // Custom shortcuts
    shortcuts.slice().reverse().forEach((shortcut, i, a) => {
        let url = shortcut.href.startsWith('https://') ? shortcut.href : `https://${shortcut.href}`
        url = url.replace('$SCHOOLNAAM', window.location.hostname.split('.')[0])
        saveToStorage('schoolName', window.location.hostname.split('.')[0], 'local')
        let shortcutDiv = element('div', `st-shortcut-${i}`, appbar, { class: 'menu-button' }),
            shortcutA = element('a', `st-shortcut-${i}-a`, shortcutDiv, { href: url, target: '_blank', }),
            shortcutI = element('i', `st-shortcut-${i}-i`, shortcutA, { class: 'st-shortcut-icon', innerText: shortcut.icon }),
            shortcutSpan = element('span', null, shortcutA, { innerText: url.replace('https://', '').split('/')?.[0] || "Ongeldige URL" })

        if (spacer) spacer.after(shortcutDiv)

        if (syncedStorage['hotkeys-enabled'] && shortcut.hotkey?.length > 0) {
            shortcutA.dataset.hotkey = shortcut.hotkey.toLowerCase()
            shortcutHotkey = element('div', `st-shortcut-${i}-hotkey-label`, shortcutA, { class: 'st-hotkey-label', innerText: formatKey(shortcut.hotkey), style: `--transition-delay: ${i * 10}ms; --reverse-transition-delay: ${(a.length - i) * 5}ms` })
        }
    })

    // Handle forced logout
    let userMenuLink = await awaitElement('#user-menu')
    userMenuLink.addEventListener('click', async () => {
        let logoutLink = await awaitElement('#log-off')
        logoutLink?.addEventListener('click', async () => {
            await saveToStorage('force-logout', new Date().getTime(), 'local')
        })
    })

    // Easter egg
    if (Math.random() < 0.006) /* 0,6% */ setTimeout(() => logos.forEach(e => e.classList.add('dvd-screensaver')), 2000)
    if (Math.random() < 0.008) /* 0,8% */ setTimeout(() => document.querySelector('.logo-expanded').setAttribute('src', 'https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/logo_mogister.svg'), 2000)
    if (Math.random() < 0.010) /* 1,0% */ notify('snackbar', "Bedankt voor het gebruiken van Study Tools 💚")
    if (Math.random() < 0.0002) /* 0,02% */ notify('snackbar', "Dit is zeldzaam. En niemand zal je geloven. Groetjes, Quinten")
    if (Math.random() < 0.004) setTimeout(() => {
        const amogus = element('img', 'st-amogus', document.body, {
            src: 'https://static.wikia.nocookie.net/fnaf-tower-defense/images/7/77/Among-us-red-png-01.png', style: `position: absolute; bottom: 0; left: 20px; height: 32px; animation: 1000ms peekInLeft; z-index: 9000;`
        })
        amogus.addEventListener('click', () => {
            var audio = new Audio('https://www.myinstants.com/media/sounds/among-us-roundstart.mp3')
            audio.play()
        })
    }, 2000)

    // Birthday party mode!
    const accountInfo = await MagisterApi.accountInfo(),
        dateOfBirth = new Date(new Date(accountInfo?.Persoon?.Geboortedatum)?.setHours(0, 0, 0, 0)),
        birthday = new Date(new Date(dateOfBirth).setYear(now.getFullYear())),
        firstName = accountInfo?.Persoon?.Roepnaam || accountInfo?.Persoon?.OfficieleVoornamen,
        isBirthdayToday = birthday.isToday(),
        isBirthdayYesterday = todayDate.getDay() === 1 && birthday.isYesterday(),
        isBirthdayTomorrow = todayDate.getDay() === 5 && birthday.isTomorrow()

    if (isBirthdayToday || isBirthdayYesterday || isBirthdayTomorrow) {
        handleSpecialDecoration('birthday')
        createStyle(`
        .menu-host, .appbar-host {
            animation: rainbow 5s linear 0s 3, red-accent 500ms 15s both;
        }

        @keyframes red-accent {
            from {
                --st-accent-primary: hsl(0, 50%, 60%);
                --st-accent-secondary: hsl(0, 50%, 55%);
            }
        }`, 'st-party-mode')
        if (isBirthdayTomorrow)
            notify('snackbar', `Alvast van harte gefeliciteerd met je verjaardag, ${firstName}!`, null, 15000)
        else if (isBirthdayYesterday)
            notify('snackbar', `Nog van harte gefeliciteerd met je verjaardag, ${firstName}!`, null, 15000)
        else if (isBirthdayToday)
            notify('snackbar', `Van harte gefeliciteerd met je verjaardag, ${firstName}!`, null, 15000)
    }

    // Hotkeys
    if (syncedStorage['hotkeys-enabled']) {
        const hotkeyList = [
            { key: '`', code: 'Backquote' },
            { key: '1', code: 'Digit1' },
            { key: '2', code: 'Digit2' },
            { key: '3', code: 'Digit3' },
            { key: '4', code: 'Digit4' },
            { key: '5', code: 'Digit5' },
            { key: '6', code: 'Digit6' },
            { key: '7', code: 'Digit7' },
            { key: '8', code: 'Digit8' },
            { key: '9', code: 'Digit9' },
            { key: '0', code: 'Digit0' },
            { key: '-', code: 'Minus' },
            { key: '=', code: 'Equal' },
            { key: '[', code: 'BracketLeft' },
            { key: ']', code: 'BracketRight' },
        ],
            hotkeysOnToday = syncedStorage['hotkeys-quick']

        setTimeout(() => {
            if (hotkeysOnToday && document.location.hash.includes('#/vandaag')) {
                createHotkeyLabels()
                document.documentElement.dataset.hotkeysVisible = true
            }
        }, 600)
        setTimeout(() => {
            if (hotkeysOnToday && document.location.hash.includes('#/vandaag')) {
                createHotkeyLabels()
                document.documentElement.dataset.hotkeysVisible = true
            }
        }, 1200)

        function createHotkeyLabels() {
            if (syncedStorage['sidebar-expand-all']) document.querySelectorAll('ul.main-menu>li.children').forEach(menuItem => menuItem.classList.add('expanded'))

            document.querySelectorAll('ul.main-menu>li:not(.ng-hide, .children) a, ul.main-menu>li.children:not(.ng-hide) ul>li a').forEach((menuItem, i, a) => {
                if (i >= hotkeyList.length) return
                let title = menuItem.querySelector('span.caption')?.innerText || menuItem.firstChild.nodeValue

                let hotkeyLabel = element('div', `st-hotkey-label-${title}`, menuItem, { class: 'st-hotkey-label', innerText: hotkeyList[i].key, style: `--transition-delay: ${i * 10}ms; --reverse-transition-delay: ${(a.length - i) * 5}ms` })

                if (hotkeyLabel.closest('li.children')) {
                    let parent = hotkeyLabel.closest('li.children')
                    let childIndex = Array.prototype.indexOf.call(parent.querySelector('ul').children, hotkeyLabel.parentElement.parentElement)
                    let hotkeyLabelParent = element('div', `st-hotkey-label-parent-${title}`, parent.firstElementChild, { class: 'st-hotkey-label st-hotkey-label-collapsed-only', innerText: hotkeyList[i].key, style: `--transition-delay: ${i * 10}ms; --reverse-transition-delay: ${(a.length - i) * 5}ms; --child-index: ${childIndex}` })
                }
            })
        }

        if (document.querySelector('#menu-berichten-new')) {
            document.querySelector('#menu-berichten-new').dataset.hotkey = 'b'
            shortcutHotkey = element('div', `st-messages-hotkey-label`, document.querySelector('#menu-berichten-new'), { class: 'st-hotkey-label', innerText: 'B' })
        }

        addEventListener('keydown', e => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.getAttribute('contenteditable') === 'true') return
            if (e.key.toLowerCase() === key.toLowerCase()) {
                e.preventDefault()
                createHotkeyLabels()
                document.documentElement.dataset.hotkeysVisible = true
            }
            if (document.documentElement.dataset.hotkeysVisible === 'true') {
                let matchingShortcut = document.querySelector(`.menu-button>a[data-hotkey="${e.key.toLowerCase()}"]`)
                if (matchingShortcut) {
                    matchingShortcut.click()
                    if (!hotkeysOnToday || !document.location.hash.includes('#/vandaag')) document.documentElement.dataset.hotkeysVisible = false
                    return
                }

                let matchingKey = hotkeyList.find(key => key.code === e.code)
                if (!matchingKey) return

                let targetElement = document.querySelectorAll('ul.main-menu>li:not(.ng-hide, .children) a, ul.main-menu>li.children:not(.ng-hide) ul>li a')?.[hotkeyList.indexOf(matchingKey)]
                if (targetElement) {
                    e.preventDefault()
                    targetElement.click()
                }
            }
        })

        addEventListener('keyup', e => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.getAttribute('contenteditable') === 'true') return
            if (e.key.toLowerCase() === key.toLowerCase()) {
                if (!hotkeysOnToday || !document.location.hash.includes('#/vandaag')) document.documentElement.dataset.hotkeysVisible = false
            }
        })

        window.addEventListener('popstate', async () => {
            if (syncedStorage['hotkeys-quick']) {
                if (document.location.hash.includes('#/vandaag')) document.documentElement.dataset.hotkeysVisible = true
                else document.documentElement.dataset.hotkeysVisible = false
            }
        })
    }
}

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    chrome.runtime.sendMessage({ action: 'popstateDetected' }) // Re-awaken the service worker

    element('meta', `st-${chrome.runtime.id}`, document.head)
    setTimeout(extensionInstanceCheck, 200)

    document.querySelectorAll('#st-aside-resize, *[id^="st-"][id$="-ghost"], *[id^="st-cc"], *[id^="st-cs"], *[id^="st-cb"], *[id^="st-start"], *[id^="st-sw"], .k-animation-container').forEach(e => {
        e.remove()
    })
    document.querySelectorAll('.st-overlay').forEach(e => { if (e.open) e.close?.() })

    setTimeout(async () => {
        const header = await awaitElement('dna-page-header', false, 1000, true)
        if (header) {
            const title = header.shadowRoot.querySelector('div.container div.title')
            if (!(title?.innerText?.length > 1)) return
            title.innerText = i18n(`views.${title.innerText}`, {}, false, true) || title.innerText
        }

        const breadcrumbs = await awaitElement('dna-breadcrumb', true, 1000, true)
        if (breadcrumbs?.length > 0) {
            breadcrumbs.forEach(e => {
                const title = e
                if (!(title?.innerText?.length > 1)) return
                title.innerHTML = title.innerHTML.replace(title.innerText, i18n(`views.${title.innerText}`, {}, false, true) || title.innerText)
            })
        }

        let frame = await awaitElement('.view iframe', false, 1000, true)
        if (Math.random() < 0.0005) frame.src = 'https://funhtml5games.com?embed=flappy'
        if (frame) {
            let interval = setIntervalImmediately(async () => {
                if (!frame?.contentDocument) {
                    frame = (await awaitElement('.view iframe', false, 500, true))
                    return
                }
                const header = frame.contentDocument.querySelector('dna-page-header')
                if (header) {
                    const title = header.shadowRoot.querySelector('div.container div.title')
                    title.innerText = i18n(`views.${title.innerText}`, {}, false, true) || title.innerText
                }
            }, 50)
            setTimeout(() => clearInterval(interval), 5000)
        }
    }, 100)

    if (new Date().getMonth() === 3 && new Date().getDate() === 1) {
        const allMenuItems = await awaitElement('ul.main-menu>li', true)
        const children = [...allMenuItems]
        children.sort(() => 0.5 - Math.random())
        children.forEach(async (child) => {
            (await awaitElement('ul.main-menu')).appendChild(child)
        })
    }
}

async function extensionInstanceCheck() {
    const otherExtensionInstances = [...document.querySelectorAll(`meta[id^="st-"]:not(#st-${chrome.runtime.id})`)].map(e => e.id.split('-')[1])

    if (otherExtensionInstances.length > 0) console.log('This instance:', chrome.runtime.id, 'Other instances:', otherExtensionInstances)

    if (chrome.runtime.id === 'ohhafpjdnbhihibepefpcmnnodaodajc' && otherExtensionInstances.includes('hacjodpccmeoocakiahjfndppdeallak')) { // This is Edge Add-Ons version, detected Chrome Web Store version
        element('meta', `copy-settings-sync`, document.head, { innerText: JSON.stringify(await chrome.storage.sync.get()) })
        element('meta', `copy-settings-local`, document.head, { innerText: JSON.stringify(await chrome.storage.local.get()) })
        setTimeout(() => {
            if (document.querySelector('meta#copy-settings-success')) {
                notify('dialog', "De nieuwe extensie is geïnstalleerd en je instellingen zijn overgezet.\n\nKlik alsjeblieft op 'Voltooien' om de oude extensie te verwijderen.", [{
                    innerText: "Voltooien", primary: true, callback: () => {
                        chrome.runtime.sendMessage({ action: 'uninstallSelf' })
                        window.location.reload()
                    }
                }], null, { allowClose: false })
            }
        }, 500)
    } else if (chrome.runtime.id === 'ohhafpjdnbhihibepefpcmnnodaodajc') {
        notify('dialog', "Deze versie van Study Tools is verouderd. Binnenkort werkt deze niet meer.\n\nKlik op 'Upgraden' en installeer de extensie.\n\nVernieuw daarna deze pagina.", [{ innerText: "Upgraden", primary: true, href: 'https://chromewebstore.google.com/detail/study-tools-voor-magister/hacjodpccmeoocakiahjfndppdeallak?hl=nl-NL' }])
    } else if (chrome.runtime.id === 'hacjodpccmeoocakiahjfndppdeallak' && otherExtensionInstances.includes('ohhafpjdnbhihibepefpcmnnodaodajc')) { // This is Chrome Web Store version, detected Edge Add-Ons version
        setTimeout(async () => {
            newSyncedStorage = JSON.parse(document.querySelector('meta#copy-settings-sync')?.innerText)
            newLocalStorage = JSON.parse(document.querySelector('meta#copy-settings-local')?.innerText)
            await chrome.storage.sync.set(newSyncedStorage)
            syncedStorage = newSyncedStorage
            await chrome.storage.local.set(newLocalStorage)
            localStorage = newLocalStorage
            element('meta', 'copy-settings-success', document.head)
        }, 250)
    } else if (otherExtensionInstances.length > 0) {
        notify('dialog', `Er zijn meerdere versies van Study Tools actief. Dit kan problemen veroorzaken!\n\nDeactiveer ${otherExtensionInstances.length === 1 ? 'één' : otherExtensionInstances.length} instantie van Study Tools via het extensiemenu.\n\nVernieuw daarna de pagina.`, [], null, { allowClose: false })
    }
}


function parseSubject(string, enabled, subjects) {
    return new Promise(async (resolve, reject) => {
        if (!enabled) resolve({ subjectAlias: '', subjectName: '', stringBefore: string, stringAfter: '', success: false })
        subjects.forEach(subjectEntry => {
            testArray = `${subjectEntry.name},${subjectEntry.aliases} `.split(',')
            testArray.forEach(testString => {
                testString = testString.toLowerCase().trim()
                if ((new RegExp(`^(${testString})$|^(${testString})[^a-z]|[^a-z](${testString})$|[^a-z](${testString})[^a-z]`, 'i')).test(string)) {
                    let stringBefore = string.replace(new RegExp(`(${testString})`, 'i'), '%%').split('%%')[0],
                        stringAfter = string.replace(new RegExp(`(${testString})`, 'i'), '%%').split('%%')[1]
                    resolve({ subjectAlias: testString, subjectName: subjectEntry.name, stringBefore, stringAfter, success: true })
                }
            })
        })
        resolve({ subjectAlias: '', subjectName: '', stringBefore: string, stringAfter: '', success: false })
    })
}

function formatKey(string) {
    if (!string) return string
    if (string === ' ') return "Spatie"
    return string.charAt(0).toUpperCase() + string.slice(1)
}

function calculateMean(values = [], weights = []) {
    let result = values.map((value, i) => {
        let weight = weights[i] ?? 1,
            sum = value * weight
        return [sum, weight]
    }).reduce((p, c) => {
        return [p[0] + c[0], p[1] + c[1]]
    }, [0, 0])
    return (result[0] / result[1])
}

function calculateMedian(values = []) {
    let sortedValues = [...values].sort()
    var half = Math.floor(sortedValues.length / 2)
    if (sortedValues.length % 2) return sortedValues[half]
    return (sortedValues[half - 1] + sortedValues[half]) / 2.0
}

function calculateMode(values = []) {
    if (values.length === 0) return { modes: [], occurrences: 0 }

    let frequencyMap = {}
    values.forEach(value => {
        frequencyMap[value] ??= 0
        frequencyMap[value]++
    })

    let maxOccurrences = 0
    let modes = []

    Object.entries(frequencyMap).forEach(([value, occurrences]) => {
        if (occurrences > maxOccurrences) {
            maxOccurrences = occurrences
            modes = [Number(value)]
        } else if (occurrences === maxOccurrences) {
            modes.push(Number(value))
        }
    })

    if (modes.length >= 1 && modes.length <= 2) return { modes, occurrences: maxOccurrences }
    else return { modes: [], occurrences: 0 }

}

function calculateVariance(values = []) {
    const average = calculateMean(values)
    const squareDiffs = values.map((value) => {
        const diff = value - average
        return diff * diff
    })
    const variance = calculateMean(squareDiffs)
    return variance
}