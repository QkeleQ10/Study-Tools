init()

async function login() {
    let signInButton = await getElement('button.button#login_container-login-button')
    if (signInButton) signInButton.click()
}

async function identity() {
    if (!await getSetting('noordhoff-login-entree')) return
    let entreeButton = await getElement('.login-form_entree-login>a')
    if (entreeButton) entreeButton.click()
}

// Run when the extension and page are loaded
async function init() {
    if (!await getSetting('noordhoff-login-enabled')) return
    popstate()

    window.addEventListener('popstate', popstate)
    window.addEventListener('hashchange', popstate)
    window.addEventListener('locationchange', popstate)
}

// Run when the URL changes
async function popstate() {
    const href = document.location.href.split('?')[0]

    if (href.includes('apps.noordhoff.nl/se') && document.title == 'Infinitas Learning platform') login()
    else if (href.endsWith('identity.noordhoff.nl/ui/#/login')) identity()
}