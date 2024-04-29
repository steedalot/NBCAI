// ==UserScript==
// @name         NBCAI
// @namespace    YourNamespace
// @version      0.8
// @description  KI-Assistent und Tutor für die NBC
// @author       Daniel Gaida, N-21
// @match        https://niedersachsen.cloud/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_registerMenuCommand
// @connect      136.243.1.228
// @downloadURL  https://github.com/steedalot/NBCAI/raw/main/ai.user.js
// ==/UserScript==


(function() {
    'use strict';

    const debug = true;
    var log = {};

    GM_registerMenuCommand("KI-Tutor starten", function() { checkForBoard(prepareSystem); });
    GM_registerMenuCommand("Informationen", function() { versionInfo(); });
    if (debug) {
        GM_registerMenuCommand("Tests starten", function() { startTests(); });
        GM_registerMenuCommand("Variablen anzeigen", function() { variableTests(); });
    }

    function writeToLog(text, error = false) {
        log[Date.now()] = text;
        if (debug) {
            if (error) {
                console.error(text);
            }
            else {
                console.log(text);
            }    
        }
    }

    function saveLogToFile() {
        var logText = "Fehlerlog des KI-Tutors\nVersion: " + version + "\n\n";
        for (var key in log) {
            let date = new Date(parseInt(key));
            console.log(date);
            let year = date.getFullYear();
            let month = ("0" + (date.getMonth() + 1)).slice(-2); // Monate beginnen bei 0 in JavaScript
            let day = ("0" + date.getDate()).slice(-2);
            let hours = ("0" + date.getHours()).slice(-2);
            let minutes = ("0" + date.getMinutes()).slice(-2);
            let seconds = ("0" + date.getSeconds()).slice(-2);
            let ms = ("00" + date.getMilliseconds()).slice(-3);
            logText += `${day}.${month}.${year} (${hours}:${minutes}:${seconds}:${ms}): ${log[key]}\n`;    
        }
        var blob = new Blob([logText], {type: "text/plain;charset=utf-8"});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = "KI-Tutor-Log.txt";
        a.click();
        a.remove();
    }


    function checkForBoard(calledFunction) {
        var url = unsafeWindow.location.href;
        if(url.includes("board")) {
            writeToLog("Aktuelles Board gefunden!");
            calledFunction();
        }
    }

    function versionInfo() {
        var textToDisplay = "KI-Tutor Entwicklungsversion\nDaniel Gaida, N-21\n\n";
        textToDisplay += "Version: " + version + "\n\n";
        var url = unsafeWindow.location.href;
        if (url.includes("board") && boardId) {
            textToDisplay += "Board ID: " + boardId + "\n";
        }
        if (Object.keys(me).length > 0) {
            textToDisplay += "Benutzer: " + me.user.firstName + " " + me.user.lastName + "\n";
            textToDisplay += "Schule: " + me.school.name + "\n";
        }
        textToDisplay += "\n";
        alert(textToDisplay);
    }


    var standardColors = {"red": "#D81E5B", "orange": "#CD8B76", "green": "#B0E298", "blue": "#8EB8E5", "yellow": "#EEF1BD" }
    var modalCSS = `.modal-overlay {
            position: fixed;
            z-index: 100;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.4);
            display: none;
        }

        .modal {
            background-color: #fff;
            z-index: 101;
            margin: 5% auto;
            border: 1px solid #ccc;
            border-radius: 5px;
            width: 80%;
            height: 80%;
            display: flex;
            flex-direction: row;
            background-color: #ffffff;
        }

        .settings {
            flex: 0 0 30%;
            padding: 10px;
            height: 100%;
            background-color: #f0f0f0;
            position: relative;
            overflow: auto;
        }

        .tokencount {
            position: absolute;
            bottom: 10px;
            right: 10px;
        }

        .chat {
            display: flex;
            flex-direction: column;
            flex: 0 0 70%;
        }

        .chatMessages {
            flex: 0 1 80%;
            padding: 10px;
            overflow: auto;
        }

        .modalText {
            font-size: 18px;
            padding: 20px;
        }

        .input-area {
            flex: 1 0 20%;
            display: flex;
            justify-content: space-between;
            flex-direction: row;
        }

        .input-field {
            flex: 0 0 85%;
        }

        .send-button-field {
            flex: 0 0 15%;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }

        .send-button {
            background-color: ${standardColors["green"]};
            color: white;
            padding: 14px 20px;
            border: none;
            cursor: pointer;
            opacity: 0.9;
            border-radius: 4px;
            margin-bottom: 10px;
        }

        .save-button {
            background-color: ${standardColors["blue"]};
            color: white;
            padding: 14px 20px;
            border: none;
            cursor: pointer;
            opacity: 0.9;
            border-radius: 4px;
        }

        .send-button:hover {
            opacity: 1;
        }

        .reset-button {
            background-color: ${standardColors["red"]};
            color: white;
            padding: 14px 20px;
            border: none;
            cursor: pointer;
            opacity: 0.9;
            border-radius: 4px;
            position: fixed;
            bottom: 20px;
            left: 20px;
        }

        .ai-button {
            background-color: ${standardColors["yellow"]};
            color: white;
            padding: 20px 20px;
            border: 3;
            cursor: pointer;
            opacity: 0.9;
            border-radius: 50%;
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 102;
            font-size: 20px;
        }

        .ai-button:hover {
            opacity: 1;
        }

        .show-button {
            display: inline-block;
            background-color: ${standardColors["blue"]};
            color: white;
            padding: 2px 10px;
            border: none;
            cursor: pointer;
            opacity: 0.9;
            border-radius: 4px;
            margin: 2px;
            margin-left: 6px;
            font-size: 12px;
        }

        .reset-button:hover {
            opacity: 1;
        }

        .input {
            margin: 10px;
            border: 1px solid #ddd;
            background-color: #f0f0f0;
            border-radius: 10px;
            padding: 10px;
            width: calc(100% - 20px);
            height: calc(100% - 20px);
            box-sizing: border-box;
        }
    
    `;

    
    const aiBoardId = "65afcedc5b38f1915d3b476e";
    const version = "0.7";
    var menuCommandId = "";
    var me = {};
    var authToken = "";
    var boardId = "";
    var boardLayout = {};
    var promptCards = [];
    var modelCards = [];
    var chatHistory = [];
    var storageAPI = {"urlCardId": "661905e7db4e2ab8e165c039",
        "keyCardId": "661905f15a3f6c2c9ecddc39",
        "url": "",
        "key": "",
        "systemPrompt": ""};



    //Auth Token aus Cookie abrufen
    function getAuthToken() {
        writeToLog("Authorization Token wird abgerufen.");
        var cookies = document.cookie.split('; ');
        for(var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var cookieName = cookie.split('=')[0];
            var cookieValue = cookie.split('=')[1];

            if(cookieName === 'jwt') {
                writeToLog('Gefundenes Authorization Token: ' + cookieValue);
                authToken = cookieValue;
                return true;
            }
        }
        writeToLog('Kein Authorization Token gefunden.');
        return false;
    }

    //ID der Schule abrufen
    function getMe() {
        return new Promise((resolve, reject) => {
            writeToLog("Accountdaten werden abgerufen.");
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://niedersachsen.cloud/api/v3/me",
                headers: {
                    "Authorization": "Bearer " + authToken
                },
                withCredentials: true,
                onload: function(response) {
                    var data = JSON.parse(response.responseText);
                    me = data;
                    resolve();
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    //ID des Boards abrufen
    function getBoardId() {
        writeToLog("Board ID des aktuellen Boards wird abgerufen.");
        var url = unsafeWindow.location.href;
        boardId = url.split('/')[4];
        writeToLog("Board ID: " + boardId);
    }

    //Layout eines beliebigen Boards abrufen
    function getBoardLayout(id) {
        return new Promise((resolve, reject) => {
            writeToLog("Board Layout des Boards " + id + " wird abgerufen.");
            if(!authToken) {
                getAuthToken();
            }
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://niedersachsen.cloud/api/v3/boards/" + id,
                headers: {
                    "Authorization": "Bearer " + authToken
                },
                withCredentials: true,
                onload: function(response) {
                    const data = JSON.parse(response.responseText);
                    resolve(data);    
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    //Layout des aktiven Boards speichern
    function saveBoardLayout(id) {
        return new Promise((resolve, reject) => {
            getBoardLayout(id)
                .then(data => {
                    boardLayout = data;
                    resolve();
                })
                .catch(error => {
                    writeToLog('Fehler beim Speichern des Board Layouts: ' + error, true);
                    reject(error);
                });
        });
    }
    

    //System-Prompts aus dem KI-Board abrufen
    function getSystemPrompts(id) {
        return new Promise((resolve, reject) => {
            getBoardLayout(id)
                .then(data => {
                    const promptsColumn = data.columns.filter(function(column) {
                        return column.title === "Prompts";
                    })[0];
    
                    const cardIds = promptsColumn.cards.map(function(card) {
                        return card.cardId;
                    });

                    const promises = [];
    
                    cardIds.forEach(function(cardId) {
                        promises.push(
                            getCardTextContent(cardId)
                                .then(result => {
                                    promptCards[result.title] = result.allText;
                                })
                                .catch(error => {
                                    writeToLog('Fehler beim Download eines Prompts: ' + error, true);
                                    reject(error);
                                })
                        );
                    });

                    Promise.all(promises)
                        .then(() => {
                            resolve();
                        })
                        .catch(error => {
                            writeToLog('Fehler beim Download der Prompts: ' + error, true);
                            reject(error);
                        });
                })
                .catch(error => {
                    writeToLog('Fehler beim Analysieren des KI-Boards: ' + error, true);
                    reject(error);
                });
        });
    }

    //Modelle aus dem KI-Board abrufen
    function getModels(id) {
        return new Promise((resolve, reject) => {
            getBoardLayout(id)
                .then(data => {
                    const modelsColumn = data.columns.filter(function(column) {
                        return column.title === "Modelle";
                    })[0];
    
                    const cardIds = modelsColumn.cards.map(function(card) {
                        return card.cardId;
                    });

                    writeToLog("Anzahl der gefundenen Modelle: " + cardIds.length);

                    const promises = [];
    
                    cardIds.forEach(function(cardId) {
                        promises.push(
                            getCardTextContent(cardId)
                                .then(result => {
                                    modelCards[result.title] = result.allText;
                                })
                                .catch(error => {
                                    writeToLog('Fehler beim Download eines Modells: ' + error, true);
                                    reject(error);
                                })
                        );
                    });

                    Promise.all(promises)
                        .then(() => {
                            resolve();
                        })
                        .catch(error => {
                            writeToLog('Fehler beim Download der Modelle: ' + error, true);
                            reject(error);
                        });

                })
                .catch(error => {
                    writeToLog('Fehler beim Analysieren des KI-Boards: ' + error, true);
                    reject(error);
                });
        });
    }

    function getStorageData() {
        return new Promise((resolve, reject) => {
            getCardTextContent(storageAPI["urlCardId"])
                .then(url => {
                    getCardTextContent(storageAPI["keyCardId"])
                        .then(key => {
                            storageAPI["url"] = url.allText;
                            storageAPI["key"] = key.allText;
                            resolve();
                        })
                        .catch(error => {
                            writeToLog('Fehler beim Abrufen des Schlüssels: ' + error, true);
                            reject(error);
                        });
                })
                .catch(error => {
                    writeToLog('Fehler beim Abrufen der URL: ' + error, true);
                    reject(error);
                });
        });
    }

    //kompletten Textinhalt einer Karte abrufen
    function getCardTextContent(cardId) {
        return new Promise((resolve, reject) => {
            if(!authToken) {
                getAuthToken();
            }
            writeToLog("Hole den Textinhalt der Karte mit der ID: " + cardId);
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://niedersachsen.cloud/api/v3/cards?ids=" + cardId,
                headers: {
                    "Authorization": "Bearer " + authToken
                },
                withCredentials: true,
                onload: function(response) {
                    var data = JSON.parse(response.responseText);
                    //Loop über die Elemente der Karte
                    var allText = "";
                    var title = data.data[0].title;
                    var elements = data.data[0].elements;
                    for(var i = 0; i < elements.length; i++) {
                        var element = elements[i];
                        if(element.content && element.content.text) {
                            allText += element.content.text;
                        }
                    }
                    var temporary_div = document.createElement('div');
                    temporary_div.innerHTML = allText;
                    var clearedText = temporary_div.textContent;
                    temporary_div.remove();
                    resolve({allText: clearedText, title: title});
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    //Testfunktionen
    function startTests() {
        writeToLog("Verbindungen werden getestet.");
        getAuthToken();
        getMe();
        console.log("Name: " + me.user.firstName + " " + me.user.lastName);
        console.log("Name der Schule: " + me.school.name);
        getBoardId();
        
    }

    function variableTests() {
        writeToLog("Variablen werden getestet.");
        console.log("Accountdaten: ", me);
        console.log("Authorization Token: ", authToken);
        console.log("Board ID: ", boardId);
        console.log("Board Layout: ", boardLayout);
        console.log("Prompt Cards:");
        for (var key in promptCards) {
            console.log("Prompt: " + key + " - Text: " + promptCards[key]);
        }
        console.log("Model Cards:");
        for (var key in modelCards) {
            console.log("Model: " + key + " - Text: " + modelCards[key]);
        }
        var modal = document.getElementById('modal');
        if (modal) {
            console.log("Modal gefunden!");
        }
        else {
            console.log("Modal nicht gefunden!");
        }
    }

    //Pipeline für Inhalte aus dem KI-Board
    function dataPipeline() {
    }

    //System vorbereiten (wichtige Daten abrufen und speichern)
    async function prepareSystem() {
        GM_registerMenuCommand("Log herunterladen", function() { saveLogToFile(); });
        createStyles();
        createAIButton();
        writeToLog("System wird vorbereitet.");
        getBoardId();
        if (getAuthToken()) {
            Promise.all([getMe(), saveBoardLayout(boardId), getSystemPrompts(aiBoardId), getModels(aiBoardId), getStorageData()])
                .then(() => {
                    writeToLog("System vorbereitet.");
                    startModal();
                    aiButtonChangeColor(standardColors["green"]);
                    //menuCommandId = GM_registerMenuCommand("KI-Tutor schließen", closeSystem());
                    var aiButton = document.getElementById('aiButton');
                    aiButton.addEventListener('click', function() {
                        aiButtonIsClicked();
                    });
                })
                .catch(error => {
                    writeToLog('Fehler bei der Vorbereitung des Systems: ' + error, true);
                    aiButtonChangeColor(standardColors["red"]);
                });
            

        }
    }

    //KI-Knopf erstellen
    function createAIButton() {
        writeToLog("Erstelle KI-Button.");
        var aiButton = document.createElement('button');
        aiButton.innerHTML = '🤖';
        aiButton.className = 'ai-button';
        aiButton.id = 'aiButton';
        document.body.appendChild(aiButton);
    }

    function aiButtonChangeColor(color) {
        var aiButton = document.getElementById('aiButton');
        aiButton.style.backgroundColor = color;
        writeToLog("Farbe des KI-Buttons geändert: " + aiButton.style.backgroundColor);
    }

    function aiButtonIsClicked() {
        writeToLog("KI-Button wurde geklickt.");
        var overlay = document.getElementById('modalOverlay');
        if (window.getComputedStyle(overlay).display === 'none') {
            overlay.style.display = 'block';
            aiButtonChangeColor(standardColors["green"]);
        }
        else {
            overlay.style.display = 'none';
            aiButtonChangeColor(standardColors["blue"]);
        }
    }

    //CSS für das Modal erstellen und im Head einfügen
    function createStyles() {
        var styleSheet = document.createElement("style");
        styleSheet.setAttribute("type", "text/css");
        styleSheet.innerText = modalCSS;
        document.head.appendChild(styleSheet);
    }
   
    //Modal erstellen und einfügen
    function startModal() {
        writeToLog("Modal wird eingerichtet.");
        var overlay = document.createElement('div');
        overlay.id = 'modalOverlay';
        overlay.className = 'modal-overlay';
        overlay.addEventListener('click', function(event) {
            if(event.target === overlay) {
                hideModal();
            }
        });

        //Modal div erstellen
        var modal = document.createElement('div');
        modal.id = 'modal';
        modal.className = 'modal';

        //Settings div erstellen
        var settings = document.createElement('div');
        settings.id = 'settings';
        settings.className = 'settings';
        settings.innerHTML = `
            <b>Einstellungen</b><br><br>
            Wähle einen Prompt aus:<br>
            <select id="promptSelect" style="all: revert;">
                ${Object.keys(promptCards).map(title => `<option value="${promptCards[title]}">${title}</option>`).join('')}
            </select>
            <br>
            <br>
            Wähle ein Modell aus:<br>
            <select id="modelSelect" style="all: revert;">
                ${Object.keys(modelCards).map(title => `<option value="${modelCards[title]}">${title}</option>`).join('')}
            </select>
        `;

        var selectData = document.createElement('div');
        selectData.id = 'selectData';
        selectData.className = 'selectData';

        boardLayout.columns.forEach(function(item) {
            var selectColumn = document.createElement('p');
            selectColumn.style = "display: inline-block; margin-bottom: 5px; font-size: 14px;";
            selectColumn.innerHTML = item.title;
            
            var showButton = document.createElement('button');
            showButton.innerHTML = "Anzeigen";
            showButton.className = "show-button";

            var selectCardField = document.createElement('div');
            selectCardField.style = "display: none";

            item.cards.forEach(function(card) {
                getCardTextContent(card.cardId)
                    .then(result => {
                        var checkbox = document.createElement('input');
                        checkbox.type = "checkbox";
                        checkbox.id = card.cardId;
                        checkbox.name = "dataText";
                        checkbox.value = result.allText;
                        checkbox.style = "margin-left: 5px;";
                        var label = document.createElement('label');
                        label.htmlFor = checkbox.id;
                        label.style = "font-size: 14px;";
                        label.textContent = result.title;
                        label.appendChild(checkbox);
                        selectCardField.appendChild(label);
                        selectCardField.appendChild(document.createElement('br'));

                    })
                    .catch(error => {
                        writeToLog('Fehler bei der Zusammenstellung der Textinhalte: ' + error, true);
                    });
            });
   
            showButton.addEventListener('click', function() {
                selectCardField.style.display = (selectCardField.style.display === "none") ? "block" : "none";
            });

            selectData.appendChild(document.createElement('br'));
            selectData.appendChild(selectColumn);
            selectData.appendChild(showButton);
            selectData.appendChild(selectCardField);
        });

        settings.appendChild(selectData);

        var selectedModel = Object.keys(modelCards)[0];


        // Erstelle den Zurücksetzen-Button
        var resetButton = document.createElement('button');
        resetButton.innerHTML = 'Zurücksetzen';
        resetButton.className = 'reset-button';
        resetButton.id = 'resetButton';

        // Erstelle das Token-Zähler-Div
        var tokenCount = document.createElement('div');
        tokenCount.id = 'tokenCount';
        tokenCount.className = 'tokencount';

        // Erstelle das Chat-Div
        var chat = document.createElement('div');
        chat.id = 'chat';
        chat.className = 'chat';
        
        // Erstelle das Chat-Verlauf-Div
        var chatMessages = document.createElement('div');
        chatMessages.id = 'chatMessages';
        chatMessages.className = 'chatMessages';

        // Erstelle das Eingabe-Div
        var inputArea = document.createElement('div');
        inputArea.id = 'inputArea';
        inputArea.className = 'input-area';

        // Erstelle das Eingabefeld
        var inputField = document.createElement('div');
        inputField.id = 'inputField';
        inputField.className = 'input-field';

        var input = document.createElement('textarea');
        input.id = 'input';
        input.value = Object.values(promptCards)[0];
        input.className = 'input';



        inputField.appendChild(input);

        var sendButtonField = document.createElement('div');
        sendButtonField.id = 'sendButtonField';
        sendButtonField.className = 'send-button-field';

        var sendButton = document.createElement('button');
        sendButton.innerHTML = 'Beginnen';
        sendButton.className = 'send-button';
        sendButton.id = 'sendButton';

        var saveButton = document.createElement('button');
        saveButton.innerHTML = 'Speichern';
        saveButton.className = 'save-button';
        saveButton.id = 'saveButton';

        sendButtonField.appendChild(sendButton);
        sendButtonField.appendChild(saveButton);

        settings.appendChild(resetButton);
        settings.appendChild(tokenCount);

        inputArea.appendChild(inputField);
        inputArea.appendChild(sendButtonField);

        chat.appendChild(chatMessages);
        chat.appendChild(inputArea);

        modal.appendChild(settings);
        modal.appendChild(chat);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Erstelle die Event-Listener für die Einstellungen
        var promptSelect = document.getElementById('promptSelect');
        var modelSelect = document.getElementById('modelSelect');
        
        promptSelect.addEventListener('change', function() {
            var selectedPrompt = promptSelect.options[promptSelect.selectedIndex].value;
            if (debug) {
                console.log("Ausgewählter Prompt: ", promptSelect.options[promptSelect.selectedIndex].text);
            }
            if (sendButton.innerHTML === "Beginnen") {
                input.value = selectedPrompt;
            }
            
        });

        modelSelect.addEventListener('change', function() {
            if (sendButton.innerHTML === "Beginnen") {
                selectedModel = modelSelect.options[modelSelect.selectedIndex].text;
                if (debug) {
                    console.log("Ausgewähltes Modell: ", modelSelect.options[modelSelect.selectedIndex].text);
                }
            }
        });


        // Erstelle den Event-Listener für das Eingabefeld
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                var prompt = input.value;
                if (sendButton.innerHTML === "Beginnen") {
                    storageAPI["systemPrompt"] = prompt;
                    writeToLog("System-Prompt für Zugriff: " + prompt);
                    var dataCheckboxes = selectData.querySelectorAll('input[name="dataText"]:checked');
                    var dataText = "";
                    dataCheckboxes.forEach(function(checkbox) {
                        dataText += checkbox.value + "\n";
                    });
                    prompt = input.value.replace("[data]", dataText);
                    prompt = prompt.replace("[name]", me.user.firstName);
                }
                buttonClicked(sendButton.innerHTML, prompt, selectedModel);
                sendButton.innerHTML = "Senden";
                input.value = "";
            }
            else {
                countTokens(input.value);
            }
        });


        // Erstelle den Event-Listener für den Zurücksetzen-Button
        resetButton.addEventListener('click', function() {
            chatHistory = [];
            renderToModal("");
            promptSelect.selectedIndex = 0;
            modelSelect.selectedIndex = 0;
            input.value = Object.values(promptCards)[0];
            var dataCheckboxes = selectData.querySelectorAll('input[name="dataText"]');
            dataCheckboxes.forEach(function(checkbox) {
                checkbox.checked = false;
            });
            sendButton.innerHTML = "Beginnen";
        });


        // Erstelle den Event-Listener für den Senden-Button
        sendButton.addEventListener('click', function() {
            var prompt = input.value;
            if (sendButton.innerHTML === "Beginnen") {
                storageAPI["systemPrompt"] = prompt;
                writeToLog("System-Prompt für Zugriff: " + prompt);
                var dataCheckboxes = selectData.querySelectorAll('input[name="dataText"]:checked');
                var dataText = "";
                dataCheckboxes.forEach(function(checkbox) {
                    dataText += checkbox.value + "\n";
                });
                prompt = input.value.replace("[data]", dataText);
                prompt = prompt.replace("[name]", me.user.firstName);
            }
            buttonClicked(sendButton.innerHTML, prompt, selectedModel);
            sendButton.innerHTML = "Senden";
            input.value = "";
        });

        // Erstelle den Event-Listener für den Speichern-Button
        saveButton.addEventListener('click', function() {
            var date = new Date();
            var filename = "NBC KI Chat (" + selectedModel + " - " + date.toISOString().slice(0,10) + ").txt";
            saveChatHistoryToDataBase(selectedModel);
        });

    }

        // Zähle die Anzahl der Tokens
    function countTokens(input) {
        var allText = chatHistory.map(obj => Object.values(obj)[0]).join(' ');
        allText += input;
        var countedTokens = allText.split(' ').length * 2.2; //token number computed by counting the spaces in the text
        var tokenCount = document.getElementById('tokenCount');
        tokenCount.innerHTML = "Tokenanzahl Eingabe (grob): <b>" + Math.round(countedTokens) + "</b>";
    }

    // Der Senden-Button wird geklickt
    function buttonClicked(action, text, model) {
        writeToLog("Nachricht senden wurde initialisiert.");
        if (action === "Beginnen") {
            var text_with_name = text.replace("[name]", me.user.firstName);
            renderToModal("<b>Ein neuer Chat wird gestartet. Das Modell muss eventuell neu geladen werden.</b>", "standard", false);
            chatHistory[0] = {};
            chatHistory[0]["role"] = "system";
            chatHistory[0]["content"] = text_with_name;
            sendMessageToAPI(model);
        }
        else if (action === "Senden") {
            chatHistory[chatHistory.length] = {};
            chatHistory[chatHistory.length-1]["role"] = "user";
            chatHistory[chatHistory.length-1]["content"] = text;
            renderToModal("<br><br><b>" + me.user.firstName + " 🧑‍🏫:</b><br><span style='color: #4455EE'>" + text + "</span>", "standard", true);
            sendMessageToAPI(model);
        }
    }

    // Nachricht an die LLM API senden
    function sendMessageToAPI(model) {
        writeToLog("Nachricht wird an die API gesendet. (Modell: " + model + ")");
        if (debug) {
            console.log("Chat-Verlauf: ", chatHistory);
        }
        GM_xmlhttpRequest({
            method: "POST",
            url: modelCards[model].trim(),
            responseType: "stream",
            data: JSON.stringify({
                "model": model,
                "messages": chatHistory,
                "stream": true,
                "options": {
                    "temperature": 0,
                    "seed": 123
                }
            }),
            headers: {
                "Content-Type": "application/json"
            },
            onloadstart: async function(response) {
                writeToLog("Antwortstream beginnt.");
                renderToModal("<br><br><b>" + model + " 🤖:</b><br>", "standard", true);
                const reader = response.response.getReader();
                const decoder = new TextDecoder("utf-8");
                var responseJSON = "";
                chatHistory[chatHistory.length] = {};
                chatHistory[chatHistory.length-1]["role"] = "assistant";
                chatHistory[chatHistory.length-1]["content"] = "";
                
                
                while (true) {
                    const { value, done } = await reader.read();
                    
                    if (value) {
                    
                        let responseRAW = decoder.decode(value, { stream: true });
                        responseRAW = responseRAW.replace(/\n/g, '');
                        let responseArray = responseRAW.split("}{");
                        responseArray.forEach(function(responseJSON) {
                            responseJSON = responseJSON.trim();
                            if (!responseJSON.startsWith("{")) {
                                responseJSON = "{" + responseJSON;
                            }
                            if (!responseJSON.endsWith("}")) {
                                responseJSON += "}";
                            }

                            try {
                                var text = JSON.parse(responseJSON);
                                renderToModal(text["message"]["content"], "standard", true);
                                chatHistory[chatHistory.length-1]["content"] += text["message"]["content"];
                                if (text["done"] == true) {
                                    var tokenCount = document.getElementById('tokenCount');
                                    tokenCount.innerHTML = "Tokenanzahl: <b>" + text["eval_count"] + "</b>";
                                }
                            }
                            catch (error) {
                                writeToLog("Fehler beim Parsen der Antwort: " + error, true);
                            }
                        });

                    }

                    if (done) {
                        writeToLog("Stream beendet.");
                        break;
                    }
                }

            },
            onerror: function(error) {
                writeToLog("Fehler bei der Anfrage: " + error);
            }
        });
    }




    //Text in das Modal rendern
    function renderToModal(text, type = "standard", stream = false) {
        text = text.replace(/\n/g, "<br>");
        var modal = document.getElementById('chatMessages');
        if (!modal) {
            writeToLog("Modal nicht gefunden! Text konnte nicht gerendert werden.");
        }
        else {
            var message = document.getElementById('modalText');
            if (!message) {
                var message = document.createElement('div');
                message.id = 'modalText';
                message.className = 'modalText';
                modal.appendChild(message);
            }
            if (stream) {
                message.innerHTML += text;
                let scrollableChatMessages = document.querySelector('.chatMessages');
                scrollableChatMessages.scrollTop = scrollableChatMessages.scrollHeight;
            }
            else {
                message.innerHTML = text;
            }
            
        }
    }

    //Modal verstecken
    function hideModal() {
        var modal = document.getElementById('modalOverlay');
        modal.style.display = 'none';
        writeToLog("Modal wurde versteckt.");
    }

    //Modal schließen
    function closeSystem() {
        var modal = document.getElementById('modal');
        modal.remove();
        var overlay = document.getElementById('modalOverlay');
        overlay.remove();
        var aiButton = document.getElementById('aiButton');
        aiButton.remove();
        console.log("KI-Tutor wurde geschlossen.");
        writeToLog("KI-Tutor wurde geschlossen.");
        //GM_unregisterMenuCommand(menuCommandId);
    }


    //Chatverlauf speichern
    function saveChatHistoryToDataBase(model) {
        writeToLog("Chatverlauf wird in Datenbank gespeichert.");
        var chatHistoryText = "";
        var date = new Date();
        var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        var formattedDate = date.toLocaleString('de-DE', options).split('.').reverse().join('-');
        if (chatHistory.length === 0) {
            writeToLog('Chatverlauf ist leer.');
            return;
        }

        chatHistory.forEach(chat => {
            chatHistoryText += `Rolle: ${chat.role}\n`;
            chatHistoryText += `Inhalt: ${chat.content}\n\n`;
        });

        GM_xmlhttpRequest({
            method: "POST",
            url: storageAPI["url"],
            withCredentials: true,
            data: JSON.stringify({
                "Datum": formattedDate,
                "Benutzer:in": me.user.firstName,
                "Modell": model,
                "Bewertung": "",
                "Systemprompt": storageAPI["systemPrompt"],
                "Chatverlauf": chatHistoryText,
                "Kommentare": "",
                "Board": "https://niedersachsen.cloud/rooms/" + boardId + "/board"

            }),
            headers: {
                "Content-Type": "application/json",
                "xc-token": storageAPI["key"]
            },
            onload: function(response) {
                writeToLog("Chatverlauf wurde gespeichert.");
            },
            onerror: function(error) {
                writeToLog("Fehler beim Speichern des Chatverlaufs: " + error, true);
            }
        });
    

    }

})();