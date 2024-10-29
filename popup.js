document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const status = document.getElementById('status');
  const settingsTitle = document.getElementById('settingsTitle');

  // Load current language
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || { language: 'en' };
    updateLanguage(settings.language);
  });

  function updateLanguage(language) {
    const translations = {
      en: {
        settings: "Settings",
        export: "Export",
        import: "Import",
        settingsImported: "Settings successfully imported!",
        importError: "An error occurred while importing. Please check the file format."
      },
      hu: {
        settings: "Beállítások",
        export: "Exportálás",
        import: "Importálás",
        settingsImported: "Beállítások sikeresen importálva!",
        importError: "Hiba történt az importálás során. Kérjük, ellenőrizze a fájl formátumát."
      }
    };

    const t = translations[language];
    settingsTitle.textContent = t.settings;
    exportBtn.textContent = t.export;
    importBtn.textContent = t.import;
  }

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.style.display = 'block';
    status.className = 'status ' + (isError ? 'error' : 'success');
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }

  exportBtn.addEventListener('click', function() {
    chrome.storage.local.get(['settings'], function(result) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.settings || {}));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "jira_assistant_settings.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });
  });

  importBtn.addEventListener('click', function() {
    importFile.click();
  });

  importFile.addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const settings = JSON.parse(e.target.result);
        chrome.storage.local.set({settings: settings}, function() {
          chrome.storage.local.get(['settings'], function(result) {
            updateLanguage(result.settings.language);
            showStatus(translations[result.settings.language].settingsImported);
          });
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {type: 'settingsUpdated'});
            }
          });
        });
      } catch (error) {
        chrome.storage.local.get(['settings'], function(result) {
          showStatus(translations[result.settings.language].importError, true);
        });
      }
    };
    
    reader.readAsText(file);
  });
});
