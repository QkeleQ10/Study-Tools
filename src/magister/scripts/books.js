// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].includes('/leermiddelen')) booksList()
}

async function booksList() {
    let bookNames = syncedStorage['books'] || {}

    const bookEntries = await awaitElement('#leermiddelen-container tr[data-ng-repeat="leermiddel in items"]', true)

    console.log(bookEntries)

    bookEntries.forEach(bookEntry => {
        const ean = bookEntry.querySelector('td[data-ng-bind="leermiddel.EAN"]').innerText
        const titleCell = bookEntry.querySelector('td>a[data-ng-bind="leermiddel.Titel"]')
        const originalTitle = `${titleCell.innerText}`

        titleCell.title = originalTitle

        if (bookNames[ean]?.length > 1) titleCell.innerText = bookNames[ean]

        const editButton = element('button', `st-book-${ean}-edit`, titleCell.parentElement, { class: 'st-button icon', 'data-icon': '', title: `Nieuwe naam opgeven voor ${originalTitle}`, style: 'position: absolute; top: 50%; right: 4px; translate: 0 -50%; opacity: .5;' })
        editButton.addEventListener('click', () => {
            let result = prompt(`Nieuwe naam opgeven voor ${originalTitle}`)
            if (result?.length > 1) {
                bookNames[ean] = result
                titleCell.innerText = bookNames[ean]
                saveToStorage('books', bookNames)
            } else {
                delete bookNames[ean]
                titleCell.innerText = originalTitle
                saveToStorage('books', bookNames)
            }
        })
    })
}