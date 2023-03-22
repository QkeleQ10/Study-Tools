let start = {},
    diff = {},
    diffTimestamp = 0

init()

async function init() {
    if (chrome?.storage) start = await getSettings(null, null, true)

    document.querySelectorAll('.bind-boolean').forEach(element => {
        element.parentElement.dataset.checkbox = true
        let value = start[element.id]
        if (element.tagName === 'INPUT' && element.getAttribute('type') === 'checkbox') {
            element.checked = value
            element.addEventListener('input', event => pushSetting(event.target.id, event.target.checked, event.target))
        }
    })

    document.querySelectorAll('.bind-string').forEach(element => {
        let value = start[element.id] || defaults[element.id]
        if (element.tagName === 'SELECT' || (element.tagName === 'INPUT' && (element.getAttribute('type') === 'text' || element.getAttribute('type') === 'password' || element.getAttribute('type') === 'email'))) {
            if (value) element.value = value
            element.addEventListener('input', event => pushSetting(event.target.id, event.target.value, event.target))
        }
        if (!start[element.id] && defaults[element.id]) pushSetting(element.id, defaults[element.id], element)
    })

    document.querySelectorAll('.bind-number').forEach(element => {
        let value = start[element.id] || defaults[element.id]
        if (element.tagName === 'INPUT' && (element.getAttribute('type') === 'range')) {
            if (value) element.value = value
            element.parentElement.querySelector('.current-value').innerText = Number(value).toLocaleString('nl-NL')
            element.addEventListener('input', event => {
                pushSetting(event.target.id, event.target.value, event.target)
                event.target.parentElement.querySelector('.current-value').innerText = Number(event.target.value).toLocaleString('nl-NL')
            })
        }
        if (!start[element.id] && defaults[element.id]) pushSetting(element.id, defaults[element.id], element)
    })

    document.querySelectorAll('.bind-color').forEach(element => {
        element.parentElement.dataset.range = true
        let value = start[element.id] || defaults[element.id]
        if (element.tagName === 'INPUT' && element.getAttribute('type') === 'range') {
            if (value) element.value = value
            element.parentElement.querySelector('.current-value').innerText = value
            element.addEventListener('input', event => {
                pushSetting(event.target.id, event.target.value, event.target)
                document.querySelector(':root').style.setProperty(`--${event.target.dataset.colorComponent}`, event.target.dataset.colorComponent === 'hue' ? event.target.value : event.target.value + '%')
                event.target.parentElement.querySelector('.current-value').innerText = event.target.value
            })
        }
        document.querySelector(':root').style.setProperty(`--${element.dataset.colorComponent}`, element.dataset.colorComponent === 'hue' ? element.value : element.value + '%')
        if (!start[element.id] && defaults[element.id]) pushSetting(element.id, defaults[element.id], element)
    })

    document.querySelectorAll('.bind-subjects').forEach(element => {
        let values = start[element.id] || defaults[element.id]
        for (let i = 0; i < values.length + 1; i++) {
            const value = values[i] || { name: '', aliases: '' }
            let gridSubjects = document.createElement('div'),
                input1 = document.createElement('input'),
                input2 = document.createElement('input')
            element.append(gridSubjects)
            gridSubjects.classList.add('grid-subjects')
            gridSubjects.append(input1, input2)
            input1.setAttribute('type', 'text')
            input1.value = value.name
            input2.setAttribute('type', 'text')
            input2.value = value.aliases
        }
        element.querySelectorAll('input').forEach(inputElement => inputElement.addEventListener('input', updateSubjects))
        if (!start[element.id] && defaults[element.id]) updateSubjects()
    })

    document.getElementById('about-version').innerText = `Updatelogboek (versie ${chrome.runtime.getManifest().version})`

    if (chrome?.runtime?.getManifest()?.update_url) document.querySelectorAll('.remove-if-prod').forEach(e => e.remove())
    else document.querySelectorAll('.remove-if-dev').forEach(e => e.remove())

    document.querySelectorAll('section[data-group][data-title]').forEach(section => {
        let aside = document.querySelector('aside'),
            group = document.querySelector(`aside>div[data-group="${section.dataset.group}"]`)
        if (!group) {
            group = document.createElement('div')
            aside.appendChild(group)
            group.dataset.group = section.dataset.group
            let groupHeading = document.createElement('h3')
            group.appendChild(groupHeading)
            groupHeading.innerText = section.dataset.group
        }
        let sectionButton = document.createElement('a')
        group.appendChild(sectionButton)
        sectionButton.dataset.linkSection = section.id
        sectionButton.innerText = section.dataset.title
        sectionButton.addEventListener('click', () => section.scrollIntoView({ block: 'start', behavior: 'smooth' }))
        let sectionHeading = document.createElement('h3')
        section.prepend(sectionHeading)
        sectionHeading.innerText = section.dataset.title
    })

    document.querySelector('aside a').dataset.active = true

    document.querySelector('main').addEventListener('scroll', event => {
        let sections = document.querySelectorAll('main>section'),
            currentSection

        for (const section of sections) {
            let rect = section.getBoundingClientRect(),
                sectionButton = document.querySelector(`[data-link-section=${section.id}]`)
            if (!currentSection && rect.top <= 250 && rect.bottom > 150) {
                currentSection = section.id
                document.querySelectorAll('aside a[data-active=true]').forEach(element => element.setAttribute('data-active', false))
                sectionButton.dataset.active = true
            }
        }
    })

    if (chrome?.runtime?.getManifest()?.version && start.openedPopup) {
        document.querySelectorAll('label[data-version]').forEach(element => {
            if (element.dataset.version.localeCompare(start.openedPopup, undefined, { numeric: true, sensitivity: 'base' }) === 1) element.classList.add('new')
        })
    }
    setSetting('openedPopup', chrome.runtime.getManifest().version)

    refreshConditionals()

    setInterval(async () => {
        if (new Date().getTime() - diffTimestamp < 300) return
        if (Object.keys(diff).length === 0) return
        await setSettings(diff, 'sync')
        diff = {}
        diffTimestamp = 0
        document.querySelectorAll('[data-saved="not-saved"]').forEach(e => e.setAttribute('data-saved', 'saved'))
        setTimeout(() => {
            document.querySelectorAll('[data-saved="saved"]').forEach(e => e.removeAttribute('data-saved'))
        }, 500)
    }, 100)
}

function updateSubjects() {
    let subjectValues = []
    const parent = document.getElementById('magister-subjects'),
        subjectWrappers = [...parent.children]
    subjectWrappers.forEach(subjectWrapper => {
        const subjectValue = {
            name: subjectWrapper.getElementsByTagName('input')[0].value,
            aliases: subjectWrapper.getElementsByTagName('input')[1].value
        },
            empty = !subjectValue.name && !subjectValue.aliases,
            lastChild = !subjectWrapper.nextSibling
        if (subjectValue.name) subjectValues.push(subjectValue)
        if (!empty && lastChild) {
            const newSubjectWrapper = document.createElement('div'),
                input1 = document.createElement('input'),
                input2 = document.createElement('input')
            newSubjectWrapper.append(input1, input2)
            newSubjectWrapper.classList.add('grid-subjects')
            input1.setAttribute('type', 'text')
            input2.setAttribute('type', 'text')
            newSubjectWrapper.querySelectorAll('input').forEach(inputElement => inputElement.addEventListener('input', updateSubjects))
            parent.appendChild(newSubjectWrapper)
        }
        if (empty && !lastChild) {
            subjectWrapper.remove()
            parent.lastElementChild.firstElementChild.focus()
        }

    })
    pushSetting(parent.id, subjectValues, parent)
}

function pushSetting(key, value, element) {
    if (!chrome?.storage) return
    refreshConditionals()
    if (element) {
        element.parentElement.setAttribute('data-saved', 'not-saved')
        element.parentElement.classList.remove('new')
    }
    diff[key] = value
    diffTimestamp = new Date().getTime()
}

function refreshConditionals() {
    document.querySelectorAll('[data-appear-if], [data-disappear-if]').forEach(e => {
        let appear = false,
            negDependency
        if (e.dataset.appearIf) {
            let appearIfs = e.dataset.appearIf.split(' '),
                numberSuccess = 0
            appearIfs.forEach((e, i, a) => {
                let posDependency = document.getElementById(e)
                if (posDependency?.checked && !appear) numberSuccess++
                if (numberSuccess === a.length) appear = true
            })
        }
        if (e.dataset.disappearIf) {
            negDependency = document.getElementById(e.dataset.disappearIf)
            if (!negDependency?.checked && appear !== false) appear = true
            if (negDependency?.checked && appear) appear = false
        }
        if (appear) {
            e.classList.remove('disabled-dependant')
            e.querySelector('input, select, textarea').removeAttribute('tabindex')
        }
        else {
            e.classList.add('disabled-dependant')
            e.querySelector('input, select, textarea').setAttribute('tabindex', '-1')
        }
    })
}

function getSetting(key, location) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].get([key], (result) => {
            let value = Object.values(result)[0]
            value ? resolve(value) : resolve('')
        })
    })
}

function getSettings(array, location, all) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].get(all ? null : array.map(e => [e]), (result) => {
            result ? resolve(result) : reject(Error('None found'))
        })
    })
}

function setSetting(key, value, location) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].set({ [key]: value }, resolve())
    })
}

function setSettings(object, location) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].set(object, resolve())
    })
}