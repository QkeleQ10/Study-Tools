init()

async function magisterLogin() {
    const forceLogoutTimestamp = await getFromStorage('force-logout', 'local')

    if (!syncedStorage['magisterLogin-enabled'] || !syncedStorage['magisterLogin-email'] || (forceLogoutTimestamp && Math.abs(new Date().getTime() - forceLogoutTimestamp) <= 30000)) return

    let signInButton = await awaitElement(`div.table[data-test-id="${syncedStorage['magisterLogin-email']}"]`)
    if (signInButton) signInButton.click()
}

// Run when the extension and page are loaded
async function init() {
    popstate()

    window.addEventListener('popstate', popstate)
    window.addEventListener('hashchange', popstate)
    window.addEventListener('locationchange', popstate)
}

// Run when the URL changes
async function popstate() {
    const href = document.location.href.split('?')[0]

    if (document.location.href.includes('accounts.magister.net')) magisterLogin()
}