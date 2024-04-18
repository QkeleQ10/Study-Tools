export default [
    {
        id: "appearance",
        settings: [
            {
                id: "ptheme",
                title: "Thema",
                type: "ThemePicker",
                default: 'auto,207,95,55',
            },
            {
                id: "pagecolor",
                title: "Achtergrondkleur",
                subtitle: "Achtergrond",
                type: "ColorOverrideSetting",
                default: 'false,0,0,7',
            },
            {
                id: "wallpaper",
                title: "Achtergrondafbeelding",
                type: "DecorationPickerSetting",
                default: 'none,',
            },
            {
                id: "sidecolor",
                title: "Menubalkkleur",
                subtitle: "Menubalk",
                type: "ColorOverrideSetting",
                default: 'false,207,95,55',
            },
            {
                id: "decoration",
                title: "Menubalkdecoratie",
                type: "DecorationPickerSetting",
                default: 'none,',
            },
            {
                id: "decoration-size",
                title: "Menubalkdecoratieformaat",
                type: "DecorationSizeSetting",
                default: 1,
                format: "percent",
                decimals: 0,
                min: 0.5,
                max: 3,
                step: 0.1,
                conditions: [
                    { settingId: 'decoration', operator: 'not starting with', value: 'none' }
                ],
            },
            {
                id: "appbarcolor",
                title: "Appbalkkleur",
                subtitle: "Appbalk",
                type: "ColorOverrideSetting",
                default: 'false,207,95,47',
            },
            {
                id: "shape",
                title: "Hoekstraal",
                type: "SlideInput",
                default: 8,
                format: "px",
                decimals: 0,
                min: 0,
                max: 20,
                step: 1,
            },
            {
                id: "darken-content",
                title: "Inhoud donker maken",
                subtitle: "Experimenteel. Studiewijzers en opdrachten donker maken indien het donkere thema actief is.",
                conditions: [
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
                default: true,
            },
        ]
    },
    {
        id: "login",
        settings: [
            {
                id: "magisterLogin-enabled",
                title: "Automatisch inloggen",
                default: true
            },
            {
                id: "magisterLogin-username",
                title: "Gebruikersnaam",
                subtitle: "Je gebruikersnaam wordt vanzelf ingevoerd.",
                type: "TextInput",
                default: '',
                conditions: [
                    { settingId: 'magisterLogin-enabled', operator: 'equal', value: true }
                ],
            },
            {
                id: "magisterLogin-email",
                title: "Microsoft-account",
                subtitle: "Vul het e-mailadres in van je Microsoft-schoolaccount—als je school gebruikmaakt van Single Sign On via Microsoft. Dit account wordt tijdens het inloggen aangeklikt.",
                type: "TextInput",
                fieldType: "email",
                default: '',
                conditions: [
                    { settingId: 'magisterLogin-enabled', operator: 'equal', value: true }
                ],
            },
        ]
    },
    {
        id: "sidebar",
        settings: [
            {
                id: "magister-appbar-week",
                title: "Weeknummer in menubalk",
                default: true,
            },
            {
                id: "shortcuts",
                title: "Snelkoppelingen menubalk",
                type: "ShortcutsEditor",
                default: [
                    { icon: '', href: '$SCHOOLNAAM.zportal.nl/app', hotkey: 'z' }
                ]
            },
            {
                id: 'magister-picture',
                title: "Profielfoto",
                type: "SegmentedButton",
                default: 'hide',
                options: [
                    {
                        value: "show",
                        title: "Schoolfoto",
                        icon: "photo_camera_front"
                    },
                    {
                        value: "custom",
                        title: "Aangepast",
                        icon: "add_photo_alternate"
                    },
                    {
                        value: "hide",
                        title: "Verbergen",
                        icon: "visibility_off"
                    },
                ],
            },
            {
                id: 'magister-picture-source',
                title: "Profielfoto kiezen",
                type: "ImageInput",
                default: null,
                conditions: [
                    { settingId: 'magister-picture', operator: 'equal', value: 'custom' },
                ],
            },

            {
                id: 'hotkeys-enabled',
                title: "Sneltoetsen",
                subtitle: "Houd de activatietoets ingedrukt en druk op een getal op je toetsenbord voor snelle navigatie.",
                default: true,
            },
            {
                id: 'magister-overlay-hotkey',
                title: "Activatietoets sneltoetsen",
                subtitle: "Deze toets activeert de sneltoetsen.",
                type: "KeyPicker",
                default: "S",
                conditions: [
                    { settingId: 'hotkeys-enabled', operator: 'equal', value: true },
                ],
            },
            {
                id: 'hotkeys-quick',
                title: "Snellere sneltoetsen",
                subtitle: "Op de startpagina zijn sneltoetsen bruikbaar zonder de activatietoets ingedrukt te hoeven houden.",
                default: false,
                conditions: [
                    { settingId: 'hotkeys-enabled', operator: 'equal', value: true },
                ],
            },
        ]
    },
    {
        id: "start",
        settings: [
            {
                id: "start-enabled",
                title: "Pagina Start",
                subtitle: "De pagina 'Vandaag' is nu 'Start'. Daarin zie je je rooster en gepersonaliseerde widgets. Aanvullende opties op Magister zelf.",
                default: true,
            },
            // TODO: possibly move these settings to the actual Start page
            {
                id: "start-schedule-view",
                title: "Rooster in Start",
                type: "SegmentedButton",
                default: "schedule",
                conditions: [
                    { settingId: 'start-enabled', operator: 'equal', value: true }
                ],
                options: [
                    {
                        value: "schedule",
                        title: "Agenda",
                        icon: "calendar_view_day"
                    },
                    {
                        value: "list",
                        title: "Lijst",
                        icon: "list"
                    },
                ],
            },
            {
                id: "start-schedule-days",
                title: "Aantal dagen weergeven in Start",
                type: "SlideInput",
                default: 1,
                format: " d",
                decimals: 0,
                min: 1,
                max: 5,
                step: 1,
                conditions: [
                    { settingId: 'start-enabled', operator: 'equal', value: true }
                ],
            },
            {
                id: "start-schedule-extra-day",
                title: "Volgende dag tonen in Start",
                subtitle: "Springen naar de eerstvolgende dag met lessen wanneer er vandaag geen lessen (meer) zijn.",
                default: true,
                conditions: [
                    { settingId: 'start-enabled', operator: 'equal', value: true },
                    { settingId: 'start-schedule-view', operator: 'equal', value: 'schedule' },
                    { settingId: 'start-schedule-days', operator: 'equal', value: 1 }
                ],
            },
        ]
    },
    {
        id: "grades",
        settings: [
            {
                id: "cc",
                title: "Cijfercalculator",
                subtitle: "Zie wat je moet halen of wat je komt te staan op basis van je cijferlijst en/of aangepaste cijfers.",
                default: true,
            },
            {
                id: "cs",
                title: "Cijferstatistieken",
                subtitle: "Nieuw tabblad in het cijferoverzicht met statistieken, grafiekjes en handige filters.",
                default: true,
            },
            {
                id: "cb",
                title: "Cijferback-up",
                subtitle: "Knop in het cijferoverzicht om je cijferlijst te exporteren en te importeren.",
                default: true,
                links: [
                    { icon: 'upload', label: "Cijferback-up importeren", href: 'https://qkeleq10.github.io/studytools/grades' }
                ],
            },
            {
                id: "insuf-red",
                title: "Onvoldoendes rood kleuren",
                subtitle: "Alleen in het cijferoverzicht en in de cijferwidget.",
                default: true,
            },
        ]
    },
    {
        id: "studyguide",
        settings: [
            {
                id: "sw-enabled",
                title: "Studiewijzers rangschikken",
                subtitle: "Studiewijzers zullen worden gegroepeerd op vak.",
                default: true,
            },
            {
                id: "sw-cols",
                title: "Aantal kolommen",
                type: "SlideInput",
                default: 3,
                decimals: 0,
                min: 1,
                max: 5,
                step: 1,
                conditions: [
                    { settingId: 'sw-enabled', operator: 'equal', value: true }
                ],
            },
            {
                id: "sw-period",
                title: "Periodenummers bij studiewijzers",
                subtitle: "In plaats van de naam van de studiewijzer.",
                default: true,
                conditions: [
                    { settingId: 'sw-enabled', operator: 'equal', value: true }
                ],
            },
            {
                id: "sw-current-week-behavior",
                title: "Huidige week in studiewijzer",
                type: "SegmentedButton",
                default: "focus",
                options: [
                    {
                        value: "focus",
                        title: "Scrollen",
                        icon: "bolt"
                    },
                    {
                        value: "highlight",
                        title: "Markeren",
                        icon: "ink_highlighter"
                    },
                    {
                        value: "off",
                        title: "Uit",
                        icon: "block"
                    },
                ]
            },
            {
                id: "sw-resources-auto",
                title: "Aanbevelingen",
                subtitle: "Soms wordt er een gecureerde collectie hulpbronnen getoond in de zijbalk.",
                default: true,
            },
        ]
    },
    {
        id: "about",
        settings: [
            {
                id: 'language',
                title: "Taal",
                subtitle: "Experimenteel",
                type: "SegmentedButton",
                default: 'nl-NL',
                options: [
                    {
                        value: "nl-NL",
                        title: "Nederlands"
                    },
                    {
                        value: "en-GB",
                        title: "English"
                    },
                    {
                        value: "fr-FR",
                        title: "Français"
                    },
                    {
                        value: "de-DE",
                        title: "Deutsch"
                    },
                    {
                        value: "la-LA",
                        title: "Latina lingua"
                    },
                ],
            },
            {
                id: "beta-options",
                title: "Ontwikkelaarsopties",
                subtitle: "Experimenteel",
                default: false,
            },
            {
                id: "verbosity",
                title: "Uitgebreide consoleberichten",
                subtitle: "Experimenteel. Er worden meer activiteiten geplaatst in de console.",
                default: false,
                conditions: [
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
            },
            // TODO: setting to disable color adaptation for dark theme
        ]
    },
]