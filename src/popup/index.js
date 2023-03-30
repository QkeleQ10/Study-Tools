let start = {},
    diff = {},
    diffTimestamp = 0,
    settingsWrapper = document.getElementById('settings-wrapper'),
    aside = document.querySelector('aside')

init()

async function init() {
    if (chrome?.storage) start = await getSettings(null, null, true)

    settingsBuilder.forEach(section => {
        settingsWrapper.innerHTML += `<section data-group="${section.group}" data-title="${section.title}" id="${section.id}"><h3>${section.title}</h3></section>`
        let sectionWrapper = document.getElementById(section.id)

        let group = document.querySelector(`aside>div[data-group="${section.group}"]`)
        if (!group) {
            group = document.createElement('div')
            aside.appendChild(group)
            group.dataset.group = section.group
            let groupHeading = document.createElement('h3')
            group.appendChild(groupHeading)
            groupHeading.innerText = section.group
        }
        let sectionButton = document.createElement('a')
        group.appendChild(sectionButton)
        sectionButton.dataset.linkSection = section.id
        sectionButton.innerText = section.title
        sectionButton.addEventListener('click', () => sectionWrapper.scrollIntoView({ block: 'start', behavior: 'smooth' }))

        section.settings.forEach(setting => {
            let value = start[setting.id] || setting.default || false,
                inputElement,
                labelElement

            switch (setting.type) {
                case 'text':
                    sectionWrapper.innerHTML += `<label class="has-text" role="listitem" for="${setting.id}" data-version="${setting.version}"><div class="title"><h4>${setting.title}</h4><h5>${setting.subtitle || ''}</h5></div><input type="text" name="${setting.title}" id="${setting.id}"></label>`
                    break

                case 'select':
                    sectionWrapper.innerHTML += `<label class="has-select" role="listitem" for="${setting.id}" data-version="${setting.version}"><div class="title"><h4>${setting.title}</h4><h5>${setting.subtitle || ''}</h5></div><div id="${setting.id}" class="select collapse"></div></label>`
                    inputElement = document.getElementById(setting.id)
                    labelElement = inputElement.parentElement
                    setting.options.forEach(option => inputElement.innerHTML += `<button data-value="${option.value}" data-selected="${value === option.value}">${option.title}</button>`)
                    setTimeout(() => {
                        inputElement = document.getElementById(setting.id)
                        labelElement = inputElement.parentElement
                        labelElement.addEventListener('click', () => {
                            inputElement.classList.toggle('collapse')
                        })
                        labelElement.addEventListener('mouseleave', () => {
                            inputElement.classList.add('collapse')
                        })
                        inputElement.querySelectorAll('[data-value]').forEach(optionElement => {
                            optionElement.addEventListener('click', () => {
                                inputElement.querySelectorAll('[data-value][data-selected]').forEach(e => e.dataset.selected = false)
                                optionElement.dataset.selected = true
                                inputElement.dataset.value = optionElement.dataset.value
                                pushSetting(setting.id, optionElement.dataset.value, inputElement)
                            })
                        })
                    }, 50)
                    break

                case 'color-picker':
                    sectionWrapper.innerHTML += `
<label class="has-color-picker" role="listitem" for="${setting.id}" data-version="${setting.version}">
    <h4>${setting.title}</h4>
    <div id="quick-colors">
        <button class="icon swatch" style="background: hsl(207deg, 95%, 55%)" data-color-values="207, 95, 55"></button>
        <button class="icon swatch" style="background: hsl(161deg, 51%, 41%)" data-color-values="161, 51, 41"></button>
        <button class="icon swatch" style="background: hsl(40deg, 51%, 41%)" data-color-values="40, 51, 41"></button>
        <button class="icon swatch" style="background: hsl(360deg, 51%, 41%)" data-color-values="360, 51, 41"></button>
        <button class="icon swatch" style="background: hsl(331deg, 51%, 41%)" data-color-values="331, 51, 41"></button>
        <button class="icon swatch" style="background: hsl(266deg, 51%, 41%)" data-color-values="266, 51, 41"></button>
        <button id="color-eyedropper"></button>
        <button id="color-advanced-toggle" class="collapse"></button>
    </div>
    <label class="has-slider collapse" for="magister-css-hue">
        <h4>Tint</h4>
        <span class="default-value">207°</span>
        <span><span class="current-value">207</span>°</span>
        <input type="range" name="Tint" id="magister-css-hue" class="bind-color" data-color-component="hue" min="0" max="360" step="1">
    </label>
    <label class="has-slider collapse" for="magister-css-saturation">
        <h4>Verzadiging</h4>
        <span class="default-value">95%</span>
        <span><span class="current-value">95</span>%</span>
        <input type="range" name="Verzadiging" id="magister-css-saturation" class="bind-color" data-color-component="saturation" min="0" max="100" step="1">
    </label>
    <label class="has-slider collapse" for="magister-css-luminance">
        <h4>Helderheid</h4>
        <span class="default-value">55%</span>
        <span><span class="current-value">55</span>%</span>
        <input type="range" name="Helderheid" id="magister-css-luminance" class="bind-color" data-color-component="luminance" min="0" max="100" step="1">
    </label>
</label>`
                    setTimeout(() => {
                        inputElement = document.getElementById('quick-colors')
                        labelElement = inputElement.parentElement
                        document.querySelectorAll('#quick-colors>button.swatch').forEach(e => {
                            e.addEventListener('click', () => setColor(window.getComputedStyle(e, null).getPropertyValue('background-color')))
                        })
                        document.getElementById('color-advanced-toggle').addEventListener('click', event => {
                            event.target.classList.toggle('collapse')
                            labelElement.querySelectorAll('label.has-slider').forEach(e => e.classList.toggle('collapse'))
                        })
                        document.getElementById('color-eyedropper').addEventListener('click', () => {
                            if (!window.EyeDropper) return console.error("Your browser does not support the EyeDropper API")
                            const eyeDropper = new EyeDropper()
                            eyeDropper
                                .open()
                                .then((result) => setColor(result.sRGBHex))
                        })
                        document.querySelectorAll('label.has-color-picker>label.has-slider>input').forEach(e => {
                            e.addEventListener('input', e => { setColor() })
                        })
                    }, 50)

                    break

                default:
                    sectionWrapper.innerHTML += `<label class="has-checkbox" role="listitem" for="${setting.id}" data-version="${setting.version}"><div class="title"><h4>${setting.title}</h4><h5>${setting.subtitle || ''}</h5></div><input type="checkbox" name="${setting.title}" id="${setting.id}" checked="${value}"></label>`
                    inputElement = document.getElementById(setting.id)
                    labelElement = inputElement.parentElement
                    inputElement.addEventListener('input', event => pushSetting(setting.id, inputElement.checked, inputElement))
                    break
            }
        })
    })

    document.getElementById('about-version').firstElementChild.innerText = `Updatelogboek (versie ${chrome?.runtime?.getManifest()?.version})`
    if (chrome?.runtime?.getManifest()?.update_url) document.querySelectorAll('.remove-if-prod').forEach(e => e.remove())
    else document.querySelectorAll('.remove-if-dev').forEach(e => e.remove())

    fetch(`https://raw.githubusercontent.com/QkeleQ10/Study-Tools/dev/updates.json`)
        .then(async response => {
            if (response.ok) {
                let data = await response.json()
                document.getElementById('about-version').lastElementChild.innerText = `${Object.keys(data)[0]}: ${data[Object.keys(data)[0]]}`
            } else console.warn("Error requesting Study Tools updates", response)
        })

    aside.querySelector('a').dataset.active = true
    aside.innerHTML += `<a data-link-section="section-about">Over</a>`

    document.querySelector('main').addEventListener('scroll', event => {
        let sections = document.querySelectorAll('main section'),
            currentSection

        for (const section of sections) {
            let rect = section.getBoundingClientRect(),
                sectionButton = document.querySelector(`[data-link-section=${section.id}]`)
            if (!currentSection && rect.top <= 250 && rect.bottom > 150) {
                currentSection = section.id
                document.querySelectorAll('aside a[data-active=true]').forEach(element => element.setAttribute('data-active', false))
                if (sectionButton) sectionButton.dataset.active = true
            }
        }
    })

    if (chrome?.runtime?.getManifest()?.version && start.openedPopup) {
        document.querySelectorAll('label[data-version]').forEach(element => {
            if (element.dataset.version !== 'undefined' && element.dataset.version.localeCompare(start.openedPopup, undefined, { numeric: true, sensitivity: 'base' }) === 1) element.classList.add('new')
        })
    }
    setSetting('openedPopup', chrome?.runtime?.getManifest()?.version)

    refreshConditionals()

    setColor({ h: start['magister-css-hue'], s: start['magister-css-saturation'], l: start['magister-css-luminance'] }, true)

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
    document.querySelectorAll('[data-appear-if], [data-disappear-if]').forEach(element => {
        let appear = false,
            negDependency,
            posDependency,
            c
        if (element.dataset.appearIf) {
            let appearIfs = element.dataset.appearIf.split(' '),
                numberSuccess = 0
            appearIfs.forEach((e, i, a) => {
                if (e.includes('===')) {
                    [e, c] = e.split('===')
                    posDependency = document.getElementById(e)
                    if ((posDependency.value || posDependency.dataset.value) === c && !appear) numberSuccess++
                } else if (e.includes('!==')) {
                    [e, c] = e.split('!==')
                    posDependency = document.getElementById(e)
                    if ((posDependency.value || posDependency.dataset.value) !== c && !appear) numberSuccess++
                } else {
                    posDependency = document.getElementById(e)
                    if (posDependency.getAttribute('type') === 'checkbox' && posDependency?.checked && !appear) numberSuccess++
                    else if ((posDependency.value || posDependency.dataset.value)?.length > 0 && !appear) numberSuccess++
                }
                if (numberSuccess === a.length) appear = true
            })
        }
        if (element.dataset.disappearIf) {
            negDependency = document.getElementById(element.dataset.disappearIf)
            if (!negDependency?.checked && appear !== false) appear = true
            if (negDependency?.checked && appear) appear = false
        }
        if (appear) {
            element.classList.remove('disabled-dependant')
            if (element.querySelector('input, select, textarea, .select'))
                element.querySelector('input, select, textarea, .select').removeAttribute('tabindex')
        }
        else {
            element.classList.add('disabled-dependant')
            if (element.querySelector('input, select, textarea, .select'))
                element.querySelector('input, select, textarea, .select').setAttribute('tabindex', '-1')
        }
    })
}

function setColor(color, noSave) {
    let r, g, b,
        colorPicker = document.querySelector('label.has-color-picker'),
        hueSlider = document.getElementById('magister-css-hue'),
        saturationSlider = document.getElementById('magister-css-saturation'),
        luminanceSlider = document.getElementById('magister-css-luminance')

    if (!color) {
        color = {
            h: hueSlider.value,
            s: saturationSlider.value,
            l: luminanceSlider.value
        }
    } else if (/^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(color) || /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/.test(color)) {
        if (/^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(color)) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)
            r = parseInt(result[1], 16)
            g = parseInt(result[2], 16)
            b = parseInt(result[3], 16)
        } else if (/rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/.test(color)) {
            const colorValues = color.substring(4, color.length - 1).split(',').map(value => parseInt(value.trim()))
            r = colorValues[0]
            g = colorValues[1]
            b = colorValues[2]
        }
        r /= 255, g /= 255, b /= 255
        var max = Math.max(r, g, b), min = Math.min(r, g, b)
        var h, s, l = (max + min) / 2
        if (max == min) {
            h = s = 0
        } else {
            var d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break
                case g: h = (b - r) / d + 2; break
                case b: h = (r - g) / d + 4; break
            }
            h /= 6
        }
        color = {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        }
    }

    if (!color.h || !color.s || !color.l) {
        return setColor({h: 207, s: 95, l: 55})
    }

    hueSlider.value = color.h
    hueSlider.parentElement.querySelector('.current-value').innerText = color.h
    saturationSlider.value = color.s
    saturationSlider.parentElement.querySelector('.current-value').innerText = color.s
    luminanceSlider.value = color.l
    luminanceSlider.parentElement.querySelector('.current-value').innerText = color.l

    if (!noSave) {
        pushSetting('magister-css-hue', color.h, colorPicker.firstElementChild)
        pushSetting('magister-css-saturation', color.s, colorPicker.firstElementChild)
        pushSetting('magister-css-luminance', color.l, colorPicker.firstElementChild)
    }

    document.querySelector(':root').style.setProperty(`--hue`, color.h)
    document.querySelector(':root').style.setProperty(`--saturation`, color.s + '%')
    document.querySelector(':root').style.setProperty(`--luminance`, color.l + '%')

    document.querySelectorAll('#quick-colors>button.swatch').forEach(qElement => {
        if (window.getComputedStyle(document.getElementById('header'), null).getPropertyValue('background-color') === qElement.style.background) qElement.classList.add('active')
        else qElement.classList.remove('active')
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