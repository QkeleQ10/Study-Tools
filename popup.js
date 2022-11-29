let start = {},
    diff = {}

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
        let value = start[element.id]
        if (element.tagName === 'INPUT' && element.getAttribute('type') === 'text') {
            if (value) element.value = value
            element.addEventListener('input', event => pushSetting(event.target.id, event.target.value))
        }
    })

    document.querySelectorAll('.bind-subjects').forEach(element => {
        let values = start[element.id] || defaults[element.id]
        for (let i = 0; i < values.length + 1; i++) {
            const value = values[i] || { name: '', aliases: '', color: '#cccccc' }
            element.innerHTML += `<div class="grid-subjects"><input type="text" value="${value.name}"><input type="text" value="${value.aliases}"><div class="input-color-container"><input type="color" value="${value.color}"></div></div>`
        }
        element.querySelectorAll('input').forEach(inputElement => inputElement.addEventListener('input', updateSubjects))
    })

    document.querySelectorAll('.allbutton').forEach(async element => {
        element.addEventListener('click', event => {
            event.target.disabled = true
            setTimeout(() => { event.target.disabled = false }, 5000)
            switch (event.target.innerText) {
                case 'Alles uit':
                    event.target.parentElement.parentElement.querySelectorAll('input[type=checkbox]').forEach(e => { if (e.checked) e.click() })
                    event.target.innerText = 'Alles aan'
                    break

                default:
                    event.target.parentElement.parentElement.querySelectorAll('input[type=checkbox]').forEach(e => { if (!e.checked) e.click() })
                    event.target.innerText = 'Alles uit'
                    break
            }
        })
    })
}

function updateSubjects(event) {
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
    diff[key] = value
    setSetting(key, value)
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