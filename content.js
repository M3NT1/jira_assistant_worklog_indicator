(function() {
    'use strict';

    let controlsDiv;
    let minimizeButton;
    let isMinimized = false;
    let settings = {};

    // Translations object
    const translations = {
        en: {
            languageSelection: "Language selection",
            defaultWorkingHours: "Default working hours:",
            defaultGreenThreshold: "Default Green threshold (%):",
            defaultYellowThreshold: "Default Yellow threshold (%):",
            update: "Update",
            export: "Export",
            import: "Import",
            workingHours: "Working hours:",
            greenThreshold: "Green Threshold (%):",
            yellowThreshold: "Yellow Threshold (%):",
            settingsImported: "Settings successfully imported!",
            importError: "An error occurred while importing. Please check the file format.",
            updatingColors: "Updating colors...",
            coloring: "Coloring:",
            initializingScript: "Initializing script...",
            collectedPersons: "Collected persons:",
            updateSetting: "Update setting:",
            settings: "Settings",
            savedSettings: "Saved settings:"
        },
        hu: {
            languageSelection: "Nyelv választása",
            defaultWorkingHours: "Alapértelmezett munkaórák:",
            defaultGreenThreshold: "Alapértelmezett zöld küszöb (%):",
            defaultYellowThreshold: "Alapértelmezett sárga küszöb (%):",
            update: "Frissítés",
            export: "Export",
            import: "Import",
            workingHours: "Munkaórák:",
            greenThreshold: "Zöld küszöb (%):",
            yellowThreshold: "Sárga küszöb (%):",
            settingsImported: "Beállítások sikeresen importálva!",
            importError: "Hiba történt az importálás során. Kérjük, ellenőrizze a fájl formátumát.",
            updatingColors: "Színek frissítése...",
            coloring: "Színezés:",
            initializingScript: "Szkript inicializálása...",
            collectedPersons: "Kigyűjtött személyek:",
            updateSetting: "Beállítás frissítése:",
            settings: "Beállítások",
            savedSettings: "Mentett beállítások:"
        }
    };

    // Helper function to get translated text
    function getText(key) {
        return translations[settings.language || 'en'][key];
    }

    // Function to load settings from storage
    function loadSettings(callback) {
        chrome.storage.local.get('settings', function(result) {
            settings = result.settings || {
                language: 'en',
                defaultWorkHours: 8,
                defaultGreenThreshold: 90,
                defaultYellowThreshold: 80,
                persons: {}
            };
            if (callback) callback();
        });
    }

    // Function to save settings to storage
    function saveSettings() {
        chrome.storage.local.set({settings: settings}, function() {
            console.log(getText('savedSettings'), settings);
        });
    }

    // Function to create language selection buttons
    function createLanguageSection() {
        const section = document.createElement('div');
        section.style.marginBottom = '20px';
        section.style.borderBottom = '1px solid #ccc';
        section.style.paddingBottom = '10px';

        const label = document.createElement('div');
        label.textContent = getText('languageSelection');
        label.style.marginBottom = '5px';
        label.style.fontWeight = 'bold';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';

        const englishButton = document.createElement('button');
        englishButton.textContent = 'English';
        englishButton.style.padding = '5px 10px';
        englishButton.style.borderRadius = '5px';
        englishButton.style.cursor = 'pointer';
        englishButton.style.border = '1px solid';
        englishButton.style.color = '#fff';

        const hungarianButton = document.createElement('button');
        hungarianButton.textContent = 'Magyar';
        hungarianButton.style.padding = '5px 10px';
        hungarianButton.style.borderRadius = '5px';
        hungarianButton.style.cursor = 'pointer';
        hungarianButton.style.border = '1px solid';
        hungarianButton.style.color = '#fff';

        function updateButtonStyles() {
            englishButton.style.backgroundColor = settings.language === 'en' ? '#007bff' : '#28a745';
            englishButton.style.borderColor = settings.language === 'en' ? '#0056b3' : '#28a745';
            hungarianButton.style.backgroundColor = settings.language === 'hu' ? '#007bff' : '#28a745';
            hungarianButton.style.borderColor = settings.language === 'hu' ? '#0056b3' : '#28a745';
        }

        englishButton.addEventListener('click', () => {
            settings.language = 'en';
            saveSettings();
            updateButtonStyles();
            refreshUI();
        });

        hungarianButton.addEventListener('click', () => {
            settings.language = 'hu';
            saveSettings();
            updateButtonStyles();
            refreshUI();
        });

        updateButtonStyles();

        buttonContainer.appendChild(englishButton);
        buttonContainer.appendChild(hungarianButton);

        section.appendChild(label);
        section.appendChild(buttonContainer);

        return section;
    }

    // Function to create button
    function createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.marginTop = '10px';
        button.style.marginRight = '5px';
        button.style.background = '#28a745';
        button.style.border = '1px solid #28a745';
        button.style.color = '#fff';
        button.style.padding = '5px 10px';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.addEventListener('click', onClick);
        return button;
    }

    // Function to create input field
    function createInput(labelText, key, defaultValue) {
        const container = document.createElement('div');
        container.style.marginBottom = '5px';

        const label = document.createElement('label');
        label.textContent = labelText;

        const input = document.createElement('input');
        input.type = 'number';
        input.value = key.includes('.') ? 
            (settings.persons[key.split('.')[1]]?.[key.split('.')[2]] ?? settings[key.split('.')[2]] ?? defaultValue) : 
            (settings[key] ?? defaultValue);
        input.style.marginLeft = '5px';
        input.style.width = '50px';
        input.addEventListener('change', () => updateSettings(key, input.value));

        container.appendChild(label);
        container.appendChild(input);

        return container;
    }

    // Function to update settings
    function updateSettings(key, value) {
        console.log(getText('updateSetting'), `${key} = ${value}`);
        if (key.includes('.')) {
            const [category, name, subKey] = key.split('.');
            if (typeof settings[category][name] !== 'object') {
                settings[category][name] = {};
            }
            settings[category][name][subKey] = parseFloat(value);
        } else {
            settings[key] = parseFloat(value);
        }
        saveSettings();
        refreshColors();
    }

    // Function to refresh UI
    function refreshUI() {
        addControls();
        collectPersons();
        refreshColors();
    }

    // Function to add controls
    function addControls() {
        if (controlsDiv) {
            document.body.removeChild(controlsDiv);
        }

        controlsDiv = document.createElement('div');
        controlsDiv.style.position = 'fixed';
        controlsDiv.style.top = '10px';
        controlsDiv.style.left = '10px';
        controlsDiv.style.zIndex = '9999';
        controlsDiv.style.backgroundColor = '#f1fbff';
        controlsDiv.style.border = '2px solid #a4b7c1';
        controlsDiv.style.borderRadius = '20px';
        controlsDiv.style.color = '#001';
        controlsDiv.style.padding = '5px 8px 5px 12px';
        controlsDiv.style.maxHeight = '80vh';
        controlsDiv.style.overflowY = 'auto';

        minimizeButton = document.createElement('button');
        minimizeButton.textContent = '−';
        minimizeButton.style.position = 'absolute';
        minimizeButton.style.top = '3px';
        minimizeButton.style.left = '3px';
        minimizeButton.style.width = '20px';
        minimizeButton.style.height = '20px';
        minimizeButton.style.padding = '0';
        minimizeButton.style.background = '#28a745';
        minimizeButton.style.border = '1px solid #28a745';
        minimizeButton.style.color = '#fff';
        minimizeButton.style.borderRadius = '50%';
        minimizeButton.style.fontSize = '16px';
        minimizeButton.style.lineHeight = '1';
        minimizeButton.style.display = 'flex';
        minimizeButton.style.justifyContent = 'center';
        minimizeButton.style.alignItems = 'center';
        minimizeButton.style.cursor = 'pointer';
        minimizeButton.addEventListener('click', toggleMinimize);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('controls-content');
        contentDiv.style.marginTop = '25px';

        // Add language selection
        contentDiv.appendChild(createLanguageSection());

        const defaultWorkHoursInput = createInput(getText('defaultWorkingHours'), 'defaultWorkHours', 8);
        const defaultGreenThresholdInput = createInput(getText('defaultGreenThreshold'), 'defaultGreenThreshold', 90);
        const defaultYellowThresholdInput = createInput(getText('defaultYellowThreshold'), 'defaultYellowThreshold', 80);

        const refreshButton = createButton(getText('update'), () => {
            collectPersons();
            refreshColors();
        });

        const exportButton = createButton(getText('export'), exportSettings);
        const importButton = createButton(getText('import'), importSettings);

        contentDiv.appendChild(defaultWorkHoursInput);
        contentDiv.appendChild(defaultGreenThresholdInput);
        contentDiv.appendChild(defaultYellowThresholdInput);
        contentDiv.appendChild(refreshButton);
        contentDiv.appendChild(exportButton);
        contentDiv.appendChild(importButton);

        controlsDiv.appendChild(minimizeButton);
        controlsDiv.appendChild(contentDiv);

        document.body.appendChild(controlsDiv);
    }

    // Function to toggle minimize
    function toggleMinimize() {
        const content = controlsDiv.querySelector('.controls-content');
        if (isMinimized) {
            content.style.display = 'block';
            minimizeButton.textContent = '−';
            controlsDiv.style.width = 'auto';
            controlsDiv.style.height = 'auto';
        } else {
            content.style.display = 'none';
            minimizeButton.textContent = '+';
            controlsDiv.style.width = '30px';
            controlsDiv.style.height = '30px';
        }
        isMinimized = !isMinimized;
    }

    // Function to collect persons
    function collectPersons() {
        const currentPersons = {};
        const rows = document.querySelectorAll('tr.pointer.auto-wrap[data-row-id="user"]');
        rows.forEach(row => {
            const nameElement = row.querySelector('.user-info-min .name');
            if (nameElement) {
                const name = nameElement.textContent.trim();
                if (typeof settings.persons[name] !== 'object') {
                    settings.persons[name] = {};
                }
                currentPersons[name] = settings.persons[name];
            }
        });

        settings.persons = { ...settings.persons, ...currentPersons };
        saveSettings();

        const oldPersonInputs = controlsDiv.querySelectorAll('.person-input');
        oldPersonInputs.forEach(input => input.remove());

        Object.keys(currentPersons).forEach(name => {
            const personContainer = document.createElement('div');
            personContainer.classList.add('person-input');
            personContainer.style.marginTop = '10px';
            personContainer.style.borderTop = '1px solid #ccc';
            personContainer.style.paddingTop = '10px';

            const nameLabel = document.createElement('strong');
            nameLabel.textContent = name;
            personContainer.appendChild(nameLabel);

            const workHoursInput = createInput(getText('workingHours'), `persons.${name}.workHours`, settings.defaultWorkHours);
            const greenThresholdInput = createInput(getText('greenThreshold'), `persons.${name}.greenThreshold`, settings.defaultGreenThreshold);
            const yellowThresholdInput = createInput(getText('yellowThreshold'), `persons.${name}.yellowThreshold`, settings.defaultYellowThreshold);

            personContainer.appendChild(workHoursInput);
            personContainer.appendChild(greenThresholdInput);
            personContainer.appendChild(yellowThresholdInput);

            controlsDiv.querySelector('.controls-content').insertBefore(personContainer, controlsDiv.querySelector('.controls-content').lastChild);
        });

        console.log(getText('collectedPersons'), Object.keys(currentPersons));
    }

    // Function to refresh colors
    function refreshColors() {
        console.log(getText('updatingColors'));
        const rows = document.querySelectorAll('tr.pointer.auto-wrap[data-row-id="user"]');
        rows.forEach(row => {
            const nameElement = row.querySelector('.user-info-min .name');
            if (nameElement) {
                const name = nameElement.textContent.trim();
                console.log(getText('coloring'), name);
                const cells = row.querySelectorAll('.day-wl-block');
                cells.forEach(cell => colorLogIndicator(cell, name));
                colorTotalField(row, name);
            }
        });
    }

    // Function to count work days
    function countWorkDays(row) {
        const cells = row.querySelectorAll('.day-wl-block');
        let workDays = 0;
        let holidays = 0;

        cells.forEach(cell => {
            if (cell.classList.contains('col-holiday')) {
                holidays++;
            } else {
                workDays++;
            }
        });

        return {
            workDays: workDays,
            holidays: holidays
        };
    }

    // Function to color total field
    function colorTotalField(row, name) {
        const totalCell = row.querySelector('td[data-test-id="total"]');
        if (!totalCell) return;

        const totalHours = parseFloat(totalCell.textContent) || 0;
        const { workHours } = getPersonSettings(name);
        const { workDays, holidays } = countWorkDays(row);

        // Számoljuk ki az elvárt munkaórákat
        const expectedTotalHours = workDays * workHours;

        // Gyűjtsük ki a holiday napokon logolt órákat
        let holidayHours = 0;
        const holidayCells = row.querySelectorAll('.col-holiday.day-wl-block');
        holidayCells.forEach(cell => {
            const value = parseFloat(cell.textContent) || 0;
            holidayHours += value;
        });

        // A teljes logolt órák (beleértve a holiday-n logoltakat is)
        const totalLoggedHours = totalHours;

        // Számítsuk ki a százalékot az elvárt munkaórákhoz képest
        const percentage = ((totalLoggedHours) / (expectedTotalHours)) * 100;

        console.log(`${name} - Munkanapok: ${workDays}, Ünnepnapok: ${holidays}, ` +
                    `Elvárt órák: ${expectedTotalHours}, Logolt órák: ${totalLoggedHours}, ` +
                    `Holiday órák: ${holidayHours}, Százalék: ${percentage}%`);

        // Színezzük a total cellát a százalék alapján
        const { greenThreshold, yellowThreshold } = getPersonSettings(name);

        if (percentage >= greenThreshold) {
            totalCell.style.backgroundColor = 'green';
        } else if (percentage >= yellowThreshold) {
            totalCell.style.backgroundColor = 'yellow';
        } else {
            totalCell.style.backgroundColor = 'red';
        }
    }

    // Function to color log indicator
    function colorLogIndicator(cell, name) {
        const logValue = parseFloat(cell.textContent) || 0;
        const indicator = cell.querySelector('.log-indicator .prog-bar');
        const { workHours } = getPersonSettings(name);

        if (indicator) {
            const percentage = (logValue / workHours) * 100;
            indicator.style.backgroundColor = getColorForPercentage(percentage, name);
        }
    }

    // Function to get color for percentage
    function getColorForPercentage(percentage, name) {
        const { greenThreshold, yellowThreshold } = getPersonSettings(name);

        if (percentage >= greenThreshold) {
            return 'green';
        } else if (percentage >= yellowThreshold) {
            return 'yellow';
        } else {
            return 'red';
        }
    }

    // Function to get person settings
    function getPersonSettings(name) {
        if (typeof settings.persons[name] !== 'object') {
            settings.persons[name] = {};
        }
        return {
            workHours: settings.persons[name].workHours ?? settings.defaultWorkHours,
            greenThreshold: settings.persons[name].greenThreshold ?? settings.defaultGreenThreshold,
            yellowThreshold: settings.persons[name].yellowThreshold ?? settings.defaultYellowThreshold
        };
    }

    // Function to export settings
    function exportSettings() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "jira_assistant_settings.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    // Function to import settings
    function importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedSettings = JSON.parse(e.target.result);
                    settings = importedSettings;
                    saveSettings();
                    refreshUI();
                    alert(getText('settingsImported'));
                } catch (error) {
                    console.error('Import error:', error);
                    alert(getText('importError'));
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // Initialize
    console.log(getText('initializingScript'));
    loadSettings(() => {
        refreshUI();
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type === 'settingsUpdated') {
            loadSettings(() => {
                refreshUI();
            });
        }
    });

    // Observe DOM changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                refreshColors();
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
