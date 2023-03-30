const settingsBuilder = [
    {
        id: "section-magister-color",
        group: "Magister",
        title: "Thema",
        settings: [
            {
                id: "magister-css-experimental",
                title: "Verbeteringen aan uiterlijk",
                subtitle: "Veel functies van Study Tools werken mogelijk niet goed als dit is uitgeschakeld.",
                default: true
            },
            {
                id: "magister-css-theme",
                title: "Kleurenthema",
                type: "select",
                options: [
                    {
                        value: "auto",
                        title: "Aanpassen aan systeemthema",
                        default: true
                    },
                    {
                        value: "light",
                        title: "Licht thema"
                    },
                    {
                        value: "dark",
                        title: "Donker thema"
                    },
                ],
            },
            {
                id: "color-picker",
                title: "Accentkleur",
                version: "2.3.4",
                type: "color-picker",
            },
            {
                id: "magister-css-dark-invert",
                title: "Aangepaste inhoud donker maken",
                subtitle: "[Experimenteel] Studiewijzers en opdrachten donker maken indien het donkere thema actief is.",
                default: true
            },
        ]
    },
    {
        id: "section-magister-login",
        group: "Magister",
        title: "Inloggen",
        settings: [
            {
                id: 'magisterLogin-method',
                title: "Automatisch inloggen",
                type: "select",
                options: [
                    {
                        value: "microsoft",
                        title: "Met een Microsoft-account",
                        default: true
                    },
                    {
                        value: "password",
                        title: "Met een Magister-wachtwoord",
                    },
                    {
                        value: "off",
                        title: "Uit",
                    },
                ]
            },
            {
                id: 'magisterLogin-username',
                title: "Gebruikersnaam",
                type: "text"
            }
        ]
    }
]