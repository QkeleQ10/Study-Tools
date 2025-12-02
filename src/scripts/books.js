// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].includes('/leermiddelen')) booksList()
}

async function booksList() {
    let bookNames = syncedStorage['books'] || {}

    const bookEntries = await awaitElement('#leermiddelen-container tr[data-ng-repeat="leermiddel in items"]', true)

    for (const bookEntry of bookEntries) {
        const ean = bookEntry.querySelector('td[data-ng-bind="leermiddel.EAN"]').innerText;
        const titleCell = bookEntry.querySelector('td>a[data-ng-bind="leermiddel.Titel"]');
        const originalTitle = `${titleCell.innerText}`;

        titleCell.title = originalTitle;

        if (bookNames[ean]?.length > 1) titleCell.innerText = bookNames[ean];

        titleCell.parentElement.createChildElement('button', {
            class: 'st-button icon',
            'data-icon': '',
            title: i18n('renameX', { item: originalTitle }),
            style: 'position: absolute; top: 50%; right: 4px; translate: 0 -50%; opacity: .5;'
        })
            .addEventListener('click', () => {
                const dialog = new Dialog({ closeText: i18n('cancel') })
                dialog.body.createChildElement('h3', {
                    class: 'st-section-heading',
                    innerText: i18n('renameX', { item: originalTitle })
                });
                dialog.body.createChildElement('input', {
                    class: 'st-input',
                    type: 'text',
                    value: bookNames[ean] || '',
                    placeholder: originalTitle,
                    style: 'width: 100%; box-sizing: border-box; margin-top: 8px; padding: 4px;'
                })
                dialog.buttonsWrapper.createChildElement('button', { innerText: i18n('save'), class: 'st-button primary', 'data-icon': '' }).addEventListener('click', () => {
                    const input = dialog.body.querySelector('input');
                    const result = input.value.trim();
                    dialog.close();
                    if (result?.length) {
                        bookNames[ean] = result;
                        titleCell.innerText = bookNames[ean];
                        saveToStorage('books', bookNames);
                    } else {
                        delete bookNames[ean];
                        titleCell.innerText = originalTitle;
                        saveToStorage('books', bookNames);
                    }
                    sortBookEntries();
                });
                dialog.show();
            })
    }

    sortBookEntries();

    function sortBookEntries() {
        const container = bookEntries[0].parentElement;
        const entriesArray = Array.from(bookEntries);
        entriesArray.sort((a, b) => {
            const titleA = a.querySelector('td>a[data-ng-bind="leermiddel.Titel"]').innerText.toLowerCase();
            const titleB = b.querySelector('td>a[data-ng-bind="leermiddel.Titel"]').innerText.toLowerCase();
            return titleA.localeCompare(titleB);
        });
        entriesArray.forEach(entry => container.appendChild(entry));
    }
}