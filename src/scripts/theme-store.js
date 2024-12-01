popstate()
window.addEventListener('popstate', popstate)
window.addEventListener('locationchange', popstate)
window.addEventListener('hashchange', popstate)
window.addEventListener('navigate', popstate)
async function popstate(e) {
    console.log(e?.type)
    // Only run on the theme store
    if (! await awaitElement('meta#theme-store-st')) return
    // Provide the page with this extension's ID
    element('meta', `st-${chrome.runtime.id}`, document.head)

    const downloadButtons = await awaitElement('.themes>.theme .button.download', true)
    downloadButtons.forEach(button => {
        const newButton = button.cloneNode(true)
        const newButtonText = newButton.querySelector('span:not(.material-symbols-outlined):last-child')
        if (newButtonText) newButtonText.innerText = "Toevoegen"
        const newButtonIcon = newButton.querySelector('span.material-symbols-outlined')
        if (newButtonIcon) newButtonIcon.innerText = 'library_add'
        const href = newButton.getAttribute('href')
        newButton.removeAttribute('href')
        newButton.removeAttribute('download')
        newButton.addEventListener('click', async e => {
            const obj = JSON.parse(decodeURIComponent(href.replace('data:text/plain;charset=utf-8,', '')))
            const storedThemes = Object.values((await chrome.storage.local.get('storedThemes')).storedThemes)
            if (!storedThemes?.[0] || storedThemes.length >= 9) return

            storedThemes.push(obj)

            //TODO: only if not exist

            await chrome.storage.local.set({ 'storedThemes': storedThemes })
        })
        button.before(newButton)

        const buttonText = button.querySelector('span:not(.material-symbols-outlined):last-child')
        if (buttonText) buttonText.remove()
        button.classList.add('icon')
    })
}