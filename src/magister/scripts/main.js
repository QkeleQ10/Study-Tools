let subjects

//TODO: Sticky notes

// Run when the extension and page are loaded
main()
async function main() {
    let appbar = await awaitElement('.appbar'),
        logos = await awaitElement('img.logo-expanded, img.logo-collapsed', true),
        key = syncedStorage['magister-overlay-hotkey'] || 'S',
        keyDisplay = key?.charAt(0).toUpperCase() + key?.slice(1) || 'S'

    subjects = syncedStorage['magister-subjects']

    if (syncedStorage['magister-appbar-zermelo']) {
        const appbarZermelo = document.getElementById('st-appbar-zermelo') || document.createElement('div'),
            spacer = await awaitElement('.appbar>.spacer'),
            zermeloA = document.createElement('a'),
            zermeloImg = document.createElement('img'),
            zermeloSpan = document.createElement('span')
        appbarZermelo.innerText = ''
        spacer.after(appbarZermelo)
        appbarZermelo.classList.add('menu-button')
        appbarZermelo.id = 'st-appbar-zermelo'
        appbarZermelo.append(zermeloA)
        zermeloA.classList.add('zermelo-menu')
        zermeloA.setAttribute('href', `https://${syncedStorage['magister-appbar-zermelo-url'] || window.location.hostname.split('.')[0] + '.zportal.nl/app'}`)
        zermeloA.setAttribute('target', '_blank')
        zermeloA.append(zermeloImg)
        zermeloImg.setAttribute('src', 'https://raw.githubusercontent.com/QkeleQ10/QkeleQ10.github.io/main/img/zermelo.png')
        zermeloImg.setAttribute('width', '36')
        zermeloImg.style.borderRadius = '100%'
        zermeloA.append(zermeloSpan)
        zermeloSpan.innerText = "Zermelo"
    }

    if (syncedStorage['magister-appbar-week']) {
        let appbarMetrics = document.getElementById('st-appbar-metrics'),
            appbarWeek = document.getElementById('st-appbar-week') || document.createElement('div')
        if (!appbarMetrics) {
            appbarMetrics = document.createElement('div')
            appbarMetrics.id = 'st-appbar-metrics'
            appbar.prepend(appbarMetrics)
        }
        appbarMetrics.prepend(appbarWeek)
        appbarWeek.id = 'st-appbar-week'
        appbarWeek.classList.add('st-metric')
        appbarWeek.dataset.description = 'Week'
        appbarWeek.innerText = getWeekNumber()
    }

    let userMenuLink = await awaitElement('#user-menu')
    userMenuLink.addEventListener('click', async () => {
        let logoutLink = await awaitElement('.user-menu ul li:nth-child(3) a')
        logoutLink.addEventListener('click', async () => {
            await saveToStorage('force-logout', new Date().getTime(), 'local')
        })
    })

    if (Math.random() < 0.003) setTimeout(() => logos.forEach(e => e.classList.add('dvd-screensaver')), 5000)

    if (syncedStorage['magister-shortcuts']) {
        let shortcutsWrapper = document.createElement('div'),
            sElem = document.createElement('span'),
            todayElem = document.createElement('a'),
            agendaElem = document.createElement('a'),
            gradesElem = document.createElement('a'),
            studyguideElem = document.createElement('a'),
            booksElem = document.createElement('a')

        if (key === 'Control') keyDisplay = 'Ctrl'
        if (key === ' ') keyDisplay = 'Spatie'

        document.body.append(shortcutsWrapper)
        shortcutsWrapper.id = 'st-shortcuts'
        shortcutsWrapper.append(sElem, todayElem, agendaElem, gradesElem, studyguideElem, booksElem)

        setAttributes(sElem, { class: 'small st-keyboard-hint', 'data-hint': keyDisplay })

        setAttributes(todayElem, { class: 'small st-keyboard-hint', 'data-hint': '1', 'data-hint-secondary': '!', href: '#/vandaag' })
        todayElem.innerText = "Vandaag"

        setAttributes(agendaElem, { class: 'small st-keyboard-hint', 'data-hint': '2', 'data-hint-secondary': '@', href: '#/agenda' })
        agendaElem.innerText = "Agenda"

        setAttributes(gradesElem, { class: 'small st-keyboard-hint', 'data-hint': '3', 'data-hint-secondary': '#', href: '#/cijfers' })
        gradesElem.innerText = "Cijfers"

        setAttributes(studyguideElem, { class: 'small st-keyboard-hint', 'data-hint': '4', 'data-hint-secondary': '$', href: '#/elo/studiewijzer' })
        studyguideElem.innerText = "Studiewijzers"

        setAttributes(booksElem, { class: 'small st-keyboard-hint', 'data-hint': '5', 'data-hint-secondary': '%', href: '#/leermiddelen' })
        booksElem.innerText = "Leermiddelen"

        addEventListener('keydown', e => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.getAttribute('contenteditable') === 'true') return
            if (shortcutsWrapper.dataset.open === 'false' && e.key.toLowerCase() === key.toLowerCase()) {
                e.preventDefault()
                shortcutsWrapper.dataset.open = true
            }
            shortcutsWrapper.querySelectorAll('a').forEach(shortcut => {
                let primary = shortcut.dataset.hint,
                    secondary = shortcut.dataset.hintSecondary
                if ((e.key === primary || e.key === secondary) && window.getComputedStyle(shortcutsWrapper).getPropertyValue('z-index') === '10000000') {
                    shortcut.click()
                    shortcut.classList.add('clicked')
                    setTimeout(() => {
                        shortcut.classList.remove('clicked')
                    }, 1500)
                }
            })
        })

        addEventListener('keyup', e => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.getAttribute('contenteditable') === 'true') return
            if (shortcutsWrapper.dataset.open === 'true' && e.key.toLowerCase() === key.toLowerCase()) {
                setTimeout(() => {
                    if (shortcutsWrapper.dataset.open === 'true') shortcutsWrapper.dataset.open = false
                }, 1000)
            }
        })

        window.addEventListener('popstate', async () => {
            if (syncedStorage['magister-shortcuts-today']) {
                if (shortcutsWrapper?.dataset.open === 'force') shortcutsWrapper.dataset.open = false
                if (document.location.hash.includes('#/vandaag')) shortcutsWrapper.dataset.open = 'force'
            }
        })

        if (syncedStorage['magister-shortcuts-today'] && document.location.hash.includes('#/vandaag')) shortcutsWrapper.dataset.open = 'force'
        else shortcutsWrapper.dataset.open = false
    }

    if (syncedStorage['magister-notes-beta2']) {
        let notes = syncedStorage['st-notes'],
            notesWrapper = element('div', 'st-notes', document.body, { 'data-open': false }),
            pinButton = element('a', 'st-notes-pin', notesWrapper, { title: `Vastmaken/losmaken\nOf druk op de toetsen '${keyDisplay}' en '0'.` }),
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
            if ((event.key === '0' || event.key === ')') && window.getComputedStyle(notesWrapper).getPropertyValue('z-index') === '10000000') {
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
    document.querySelectorAll('.st-overlay').forEach(e => e.close())
    document.querySelectorAll('.st-button, .st-overlay, [id^="st-cf"], .k-animation-container').forEach(e => e.remove())
}

function getWeekNumber() {
    let d = new Date()
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)),
        weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return weekNo
}

async function getPeriodNumber(w = getWeekNumber()) {
    const settingPeriods = syncedStorage['magister-periods']
    let periodNumber = 0

    settingPeriods.split(',').forEach((e, i, arr) => {
        let startWeek = Number(e),
            endWeek = Number(arr[i + 1]) || Number(arr[0])
        if (endWeek < startWeek && (w >= startWeek || w < endWeek)) periodNumber = i + 1
        else if (w >= startWeek && w < endWeek) periodNumber = i + 1
    })

    return periodNumber
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

function weightedPossibleMeans(valueArray, weightArray, newWeight) {
    let means = [],
        grades = []
    for (let i = 1.0; i <= 10; i += 0.1) {
        grades.push(Number(i))
        means.push(Number(weightedMean(valueArray.concat([i]), weightArray.concat([newWeight]))))
    }
    return [means, grades]
}