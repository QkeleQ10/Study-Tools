let start = {},
    diff = {},
    diffTimestamp = 0

setSetting('openedPopup', true)

init()

async function init() {
    start = await getSettings(null, null, true)

    document.querySelectorAll('.bind-boolean').forEach(element => {
        let value = start[element.id]
        if (element.tagName === 'INPUT' && element.getAttribute('type') === 'checkbox') {
            element.checked = value
            element.addEventListener('input', event => pushSetting(event.target.id, event.target.checked))
        }
    })

    document.querySelectorAll('.bind-string').forEach(element => {
        let value = start[element.id] || defaults[element.id]
        if (element.tagName === 'INPUT' && (element.getAttribute('type') === 'text' || element.getAttribute('type') === 'password' || element.getAttribute('type') === 'email')) {
            if (value) element.value = value
            element.addEventListener('input', event => pushSetting(event.target.id, event.target.value))
        }
        if (!start[element.id] && defaults[element.id]) pushSetting(element.id, defaults[element.id])
    })

    document.querySelectorAll('.bind-subjects').forEach(element => {
        let values = start[element.id] || defaults[element.id]
        for (let i = 0; i < values.length + 1; i++) {
            const value = values[i] || { name: '', aliases: '', color: '#cccccc' }
            element.innerHTML += `<div class="grid-subjects"><input type="text" value="${value.name}"><input type="text" value="${value.aliases}"><div class="input-color-container"><input type="color" value="${value.color}"></div></div>`
        }
        element.querySelectorAll('input').forEach(inputElement => inputElement.addEventListener('input', updateSubjects))
        if (!start[element.id] && defaults[element.id]) updateSubjects()
    })

    if (!chrome.runtime.getManifest().update_url) {
        document.querySelectorAll('.if-no-update-url').forEach(e => e.removeAttribute('style'))
    }

    refreshConditionals()

    setInterval(async () => {
        if (new Date().getTime() - diffTimestamp < 500) return
        document.documentElement.dataset.saved = 'neutral'
        if (Object.keys(diff).length === 0) return
        await setSettings(diff, 'sync')
        diff = {}
        diffTimestamp = 0
        document.documentElement.dataset.saved = 'saved'
    }, 1000)
}

function updateSubjects() {
    let subjectValues = []
    const parent = document.getElementById('magister-subjects'),
        subjectWrappers = [...parent.children]
    subjectWrappers.forEach(subjectWrapper => {
        const subjectValue = {
            name: subjectWrapper.getElementsByTagName('input')[0].value,
            aliases: subjectWrapper.getElementsByTagName('input')[1].value,
            color: subjectWrapper.getElementsByTagName('input')[2].value
        },
            empty = !subjectValue.name && !subjectValue.aliases,
            lastChild = !subjectWrapper.nextSibling
        if (subjectValue.name) subjectValues.push(subjectValue)
        if (!empty && lastChild) {
            const newSubjectWrapper = document.createElement('div')
            newSubjectWrapper.classList.add('grid-subjects')
            newSubjectWrapper.innerHTML = `<input type="text"><input type="text"><div class="input-color-container"><input type="color" value="#cccccc"></div>`
            newSubjectWrapper.querySelectorAll('input').forEach(inputElement => inputElement.addEventListener('input', updateSubjects))
            parent.appendChild(newSubjectWrapper)
        }
        if (empty && !lastChild) {
            subjectWrapper.remove()
            parent.lastElementChild.firstElementChild.focus()
        }

    })
    pushSetting(parent.id, subjectValues)
}

function pushSetting(key, value) {
    refreshConditionals()
    document.documentElement.dataset.saved = 'not-saved'
    diff[key] = value
    diffTimestamp = new Date().getTime()
    if (String(value).toLowerCase().includes('lgbt')) document.querySelector('header').classList.add('lgbt')
    if (value === '69') document.querySelector('header').classList.add('nice')
}

function refreshConditionals() {
    document.querySelectorAll('[data-appear-if], [data-disappear-if]').forEach(e => {
        let appear = false, posDependency, negDependency
        if (e.dataset.appearIf) {
            posDependency = document.getElementById(e.dataset.appearIf)
            if (posDependency?.checked && !appear) appear = true
        }
        if (e.dataset.disappearIf) {
            negDependency = document.getElementById(e.dataset.disappearIf)
            if (!negDependency?.checked && appear !== false) appear = true
            if (negDependency?.checked && appear) appear = false
        }
        if (appear) e.classList.remove('hide')
        else {
            e.classList.add('hide')
            if (e.firstElementChild.checked) {
                e.firstElementChild.checked = false
                refreshConditionals()
            }
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