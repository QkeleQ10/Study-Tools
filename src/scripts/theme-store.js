popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    // Only run on the theme store
    if (! await awaitElement('meta#theme-store-st')) return
    // Provide the page with this extension's ID
    element('meta', `st-${chrome.runtime.id}`, document.head)
}