// let subjects

// Run when the extension and page are loaded
main()
async function main() {
    let appbar = await awaitElement('.appbar'),
        logos = await awaitElement('img.logo-expanded, img.logo-collapsed', true),
        key = syncedStorage['magister-overlay-hotkey'] || 'S',
        keyDisplay = key?.charAt(0).toUpperCase() + key?.slice(1) || 'S'

    // subjects = syncedStorage['subjects']

    let shortcuts = Object.values(syncedStorage.shortcuts),
        spacer = await awaitElement('.appbar>.spacer')

    // Week number indicator
    if (syncedStorage['magister-appbar-week']) {
        let appbarMetrics = element('div', 'st-appbar-metrics', appbar)
        if (spacer) spacer.before(appbarMetrics)
        else appbar.prepend(appbarMetrics)
        let appbarWeek = element('div', 'st-appbar-week', appbarMetrics, { class: 'st-metric', 'data-description': "Week", innerText: getWeekNumber() })
    }

    // Custom shortcuts
    shortcuts.slice().reverse().forEach((shortcut, i, a) => {
        let url = shortcut.href.startsWith("https://") ? shortcut.href : `https://${shortcut.href}`
        url = url.replace('$SCHOOLNAAM', window.location.hostname.split('.')[0])
        let shortcutDiv = element('div', `st-shortcut-${i}`, appbar, { class: 'menu-button' }),
            shortcutA = element('a', `st-shortcut-${i}-a`, shortcutDiv, { href: url, target: '_blank', }),
            shortcutI = element('i', `st-shortcut-${i}-i`, shortcutA, { class: 'st-shortcut-icon', innerText: shortcut.icon }),
            shortcutSpan = element('span', `st-shortcut-${i}-span`, shortcutA, { innerText: url.replace('https://', '').split('/')?.[0] || "Ongeldige URL" })

        if (spacer) spacer.after(shortcutDiv)

        if (syncedStorage['hotkeys-enabled'] && shortcut.hotkey?.length > 0) {
            shortcutA.dataset.hotkey = shortcut.hotkey.toLowerCase()
            shortcutHotkey = element('div', `st-shortcut-${i}-hotkey-label`, shortcutA, { class: 'st-hotkey-label', innerText: formatKey(shortcut.hotkey), style: `--transition-delay: ${i * 10}ms; --reverse-transition-delay: ${(a.length - i) * 5}ms` })
        }
    })

    // Handle forced logout
    let userMenuLink = await awaitElement('#user-menu')
    userMenuLink.addEventListener('click', async () => {
        let logoutLink = await awaitElement('.user-menu ul li:nth-child(3) a')
        logoutLink.addEventListener('click', async () => {
            await saveToStorage('force-logout', new Date().getTime(), 'local')
        })
    })

    // Easter egg
    if (Math.random() < 0.006) setTimeout(() => logos.forEach(e => e.classList.add('dvd-screensaver')), 5000)

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

    // Notes
    if (syncedStorage['notes-enabled']) {
        let notes = syncedStorage['st-notes'] || ['\n'],
            notesWrapper = element('div', 'st-notes', document.body, { 'data-open': false }),
            pinButton = element('a', 'st-notes-pin', notesWrapper, { title: `Vastmaken/losmaken\nOf druk op de toetsen '${keyDisplay}' en '\\'.` }),
            newButton = element('a', 'st-notes-new', notesWrapper, { title: "Nieuwe notitie" }),
            saveTimeout

        if (notes[0].length > 2) {
            setTimeout(() => {
                notesWrapper.dataset.open = true
                setTimeout(() => {
                    if (notesWrapper.dataset.open === 'true') notesWrapper.dataset.open = false
                }, 1000)
            }, 100)
        }

        if (notes.length < 1) notes = ['\n']

        notes.forEach(createNote)

        function createNote(note) {
            let noteElement = element('div', null, notesWrapper)

            note.split(/[\r\n\v]/).forEach((part, i) => {
                let partElement
                if (i === 0) {
                    partElement = element('input', null, noteElement, { type: 'text', value: part, placeholder: "Titel", readonly: true })
                }
                else {
                    partElement = element('textarea', null, noteElement, { innerText: part, readonly: true })
                    if (i === 1) partElement.placeholder = "Inhoud"
                    if (part.startsWith('==')) {
                        partElement.setAttribute('class', 'link')
                        partElement.value = part.slice(2).split('==')[0]
                        partElement.dispatchEvent(new Event('input'))
                        partElement.setAttribute('onclick', `window.location.href = "${window.location.origin + window.location.pathname + part.slice(2).split('==')[1]}"`)
                    } if (part.includes('~~')) {
                        partElement.classList.toggle('strikethrough')
                        partElement.value = part.replace('~~', '')
                    } if (part.startsWith('[]') || part.startsWith('[x]')) {
                        partElement.value = part.replace('[]', '☐').replace('[x]', '☑')
                    }
                    partElement.style.height = "17px"
                    partElement.style.height = (partElement.scrollHeight) + "px"
                    partElement.addEventListener('input', textareaInput)
                }
                partElement.addEventListener('keydown', partElementKeydown)
            })
        }

        function textareaInput(event) {
            if (event.target.classList.contains('link')) {
                event.target.classList.remove('link')
                event.target.removeAttribute('onclick')
            }
            if (event.target.classList.contains('link-pending')) {
                event.target.classList.remove('link-pending')
                event.target.value = ''
            }
            if (event.target.value.startsWith('==')) {
                event.target.setAttribute('class', 'link-pending')
                event.target.value = "Selecteer nu de tekst die moet worden geplakt."
                event.target.blur()
                addEventListener('mouseup', () => {
                    setTimeout(() => {
                        if (document.getSelection()?.toString()) {
                            event.target.setAttribute('class', 'link')
                            const parts = document.getSelection().toString().split(/[\r\n\v]+/)
                            event.target.value = parts[0]
                            event.target.setAttribute('onclick', `document.location.href = '${document.location.href}'`)
                            event.target.style.height = "17px"
                            event.target.style.height = (event.target.scrollHeight) + "px"
                            event.target.focus()
                            parts.forEach((part, i) => {
                                if (i === 0) return
                                const newTextarea = element('textarea', null, event.target.parentElement, { innerText: part, class: 'link', onclick: `document.location.href = '${document.location.href}'` })
                                event.target.after(newTextarea)
                                newTextarea.addEventListener('input', textareaInput)
                                newTextarea.addEventListener('keydown', partElementKeydown)
                                newTextarea.style.height = "17px"
                                newTextarea.style.height = (newTextarea.scrollHeight) + "px"
                                newTextarea.focus()
                            })
                        } else {
                            event.target.removeAttribute('class')
                            event.target.removeAttribute('onclick')
                            event.target.value = ''
                        }
                        save()
                    }, 200)
                }, { once: true })
            } else if (event.target.value.includes('~~')) {
                event.target.classList.toggle('strikethrough')
                event.target.value = event.target.value.replace('~~', '')
                event.target.setSelectionRange(0, 0)
            } else if (event.target.value.includes('[]') || event.target.value.includes('[x]')) {
                event.target.value = event.target.value.replace('[]', '☐').replace('[x]', '☑')
                event.target.setSelectionRange(0, 0)
            } else if (event.target.value.startsWith('##')) {
                newButton.click()
                if (event.target.nextElementSibling) event.target.remove()
                notesWrapper.querySelector('div:last-of-type>input').focus()
            }
            if (/[\r\n\v]+/.test(event.target.value)) {
                const parts = event.target.value.split(/[\r\n\v]+/)
                event.target.value = parts[0]
                parts.forEach((part, i) => {
                    if (i === 0) return
                    const newTextarea = element('textarea', null, event.target.parentElement, { innerText: part })
                    event.target.after(newTextarea)
                    newTextarea.addEventListener('input', textareaInput)
                    newTextarea.addEventListener('keydown', partElementKeydown)
                    newTextarea.style.height = "17px"
                    newTextarea.style.height = (newTextarea.scrollHeight) + "px"
                    newTextarea.focus()
                })
            }
            event.target.style.height = "17px"
            event.target.style.height = (event.target.scrollHeight) + "px"
            save()
        }

        function partElementKeydown(event) {
            let e = event.target,
                eSelStart = e.selectionStart,
                eSelEnd = e.selectionEnd,
                prev = e.previousElementSibling,
                next = e.nextElementSibling
            if (event.key === 'ArrowLeft' && eSelStart === 0 && eSelEnd === 0 && prev) {
                event.preventDefault()
                prev.focus()
                prev.setSelectionRange(prev.value.length, prev.value.length)
            } else if (event.key === 'ArrowRight' && eSelStart === e.value.length && eSelEnd === e.value.length && next) {
                event.preventDefault()
                next.focus()
                next.setSelectionRange(0, 0)
            } else if (event.key === 'ArrowUp' && prev) {
                event.preventDefault()
                prev.focus()
                prev.setSelectionRange(eSelStart, eSelEnd)
            } else if (event.key === 'ArrowDown' && next) {
                event.preventDefault()
                next.focus()
                next.setSelectionRange(eSelStart, eSelEnd)
            } else if (event.key === 'Backspace' && eSelStart === 0 && eSelEnd === 0 && e.tagName === 'TEXTAREA' && prev?.tagName === 'TEXTAREA') {
                event.preventDefault()
                let oldLen = prev.value.length
                prev.value += e.value
                if (e.value.length && oldLen) {
                    prev.removeAttribute('class')
                    prev.removeAttribute('onclick')
                }
                e.remove()
                prev.focus()
                prev.setSelectionRange(oldLen, oldLen)
                save()
            } else if (event.key === 'Delete' && eSelStart === e.value.length && eSelEnd === e.value.length && e.tagName === 'TEXTAREA' && next?.tagName === 'TEXTAREA') {
                event.preventDefault()
                let oldLen = e.value.length
                next.value = e.value + next.value
                if (next.value.length && oldLen) {
                    next.removeAttribute('class')
                    next.removeAttribute('onclick')
                }
                e.remove()
                next.focus()
                next.setSelectionRange(oldLen, oldLen)
                save()
            } else if (event.key === 'Backspace' && e.tagName === 'INPUT' && e.value.length < 1) {
                event.preventDefault()
                e.parentElement.previousElementSibling.firstElementChild.focus()
                e.parentElement.remove()
                save()
            } else {
                save()
            }
        }

        function save() {
            clearTimeout(saveTimeout)

            saveTimeout = setTimeout(() => {
                let resultArray = []
                notesWrapper.querySelectorAll('div').forEach(noteElement => {
                    let noteArray = []
                    noteElement.querySelectorAll('input, textarea').forEach(partElement => {
                        if (partElement.classList.contains('link-pending')) noteArray.push('')
                        else if (partElement.classList.contains('link')) noteArray.push('==' + partElement.value + '==#' + partElement.getAttribute('onclick').split('#')[1].split('"')[0])
                        else if (partElement.classList.contains('strikethrough')) noteArray.push('~~' + partElement.value)
                        else noteArray.push(partElement.value)
                    })
                    resultArray.push(noteArray.join('\n'))
                })
                saveToStorage('st-notes', resultArray)
            }, 2000)
        }

        notesWrapper.addEventListener('click', event => {
            if (!event.target.classList.contains('link') && notesWrapper.dataset.open !== 'force') {
                pinButton.click()
                event.target.focus()
            } else if (!event.target.classList.contains('link') && notesWrapper.querySelector('*[readonly=true]')) {
                notesWrapper.querySelectorAll('div>input, div>textarea').forEach(noteElement => {
                    noteElement.removeAttribute('readonly')
                })
            } else if (event.target.classList.contains('link') && notesWrapper.dataset.open !== 'force') {
                event.target.blur()
            }
        })

        pinButton.addEventListener('click', event => {
            event.stopPropagation()
            if (notesWrapper.dataset.open !== 'force') {
                notesWrapper.dataset.open = 'force'
                notesWrapper.querySelectorAll('div>input, div>textarea').forEach(noteElement => {
                    noteElement.removeAttribute('readonly')
                })
            } else if (notesWrapper.dataset.open === 'force') {
                notesWrapper.dataset.open = false
                notesWrapper.querySelectorAll('div>input, div>textarea').forEach(noteElement => {
                    noteElement.setAttribute('readonly', true)
                })
            }
        })

        newButton.addEventListener('click', event => {
            createNote('\n')
        })

        addEventListener('keydown', event => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.getAttribute('contenteditable') === 'true') return
            if (notesWrapper.dataset.open === 'false' && event.key.toLowerCase() === key.toLowerCase()) {
                event.preventDefault()
                notesWrapper.dataset.open = true
            }
            if ((event.code === 'Backslash') && window.getComputedStyle(notesWrapper).getPropertyValue('z-index') === '10000000') {
                pinButton.click()
            }
        })

        addEventListener('keyup', event => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.getAttribute('contenteditable') === 'true') return
            if (notesWrapper.dataset.open === 'true' && event.key.toLowerCase() === key.toLowerCase()) {
                setTimeout(() => {
                    if (notesWrapper.dataset.open === 'true') notesWrapper.dataset.open = false
                }, 1000)
            }
        })
    }
}

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
function popstate() {
    document.querySelectorAll('.st-button, .st-input, .st-checkbox-label, .st-checkbox-input, [id^="st-cf"], [id^="st-vd"], [id^="st-sw"], .k-animation-container').forEach(e => {
        e.remove()
    })
    document.querySelectorAll('.st-overlay').forEach(e => { e.close() })
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

async function msToPixels(ms) {
    return new Promise(async (resolve, reject) => {
        let settingAgendaHeight = syncedStorage['magister-vd-agendaHeight'] || 1
        resolve(0.000025 * settingAgendaHeight * ms)
    })
}

function formatKey(string) {
    if (!string) return string
    if (string === ' ') return "Spatie"
    return string.charAt(0).toUpperCase() + string.slice(1)
}

function weightedMean(valueArray = [], weightArray = []) {
    let result = valueArray.map((value, i) => {
        let weight = weightArray[i] ?? 1,
            sum = value * weight
        return [sum, weight]
    }).reduce((p, c) => {
        return [p[0] + c[0], p[1] + c[1]]
    }, [0, 0])
    return (result[0] / result[1])
}

function median(valueArray = []) {
    let values = [...valueArray].sort()
    var half = Math.floor(values.length / 2)
    if (values.length % 2) return values[half]
    return (values[half - 1] + values[half]) / 2.0
}

function standardDeviation(valueArray = []) {
    let n = valueArray.length,
        mean = valueArray.reduce((a, b) => a + b) / n
    return Math.sqrt(valueArray.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}


function weightedPossibleMeans(valueArray, weightArray, newWeight) {
    let means = [],
        grades = []
    for (let i = 1.0; i <= 10; i += 0.1) {
        grades.push(Number(i))
        means.push(Number(weightedMean(valueArray.concat([i]), weightArray.concat([newWeight]))))
    }
    return [means, grades]
}