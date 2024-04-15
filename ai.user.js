// ==UserScript==
// @name         NBCAI
// @namespace    YourNamespace
// @version      0.5
// @description  KI-Assistent und Tutor für die NBC
// @author       Daniel Gaida, N-21
// @match        https://niedersachsen.cloud/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_registerMenuCommand
// @connect      136.243.1.228
// ==/UserScript==


(function() {
    'use strict';

    GM_registerMenuCommand("preflight tests", function() { checkForBoard(startTests); });
    GM_registerMenuCommand("System vorbereiten", function() { checkForBoard(prepareSystem); });


    function checkForBoard(calledFunction) {
        var url = unsafeWindow.location.href;
        if(url.includes("board")) {
            console.log("Board gefunden!");
            calledFunction();
        }
    }

    var modalCSS = `.modal-overlay {
            position: fixed;
            z-index: 100;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.4);
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
            background-color: #4CAF50;
            color: white;
            padding: 14px 20px;
            border: none;
            cursor: pointer;
            opacity: 0.9;
            border-radius: 4px;
            margin-bottom: 10px;
        }

        .save-button {
            background-color: #ADD8E6;
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
            background-color: #FF5733;
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

        .show-button {
            display: inline-block;
            background-color: #ADD8E6;
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
        console.log("Authorization Token wird abgerufen.");
        var cookies = document.cookie.split('; ');
        for(var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var cookieName = cookie.split('=')[0];
            var cookieValue = cookie.split('=')[1];

            if(cookieName === 'jwt') {
                console.log('Gefundenes Authorization Token:', cookieValue);
                authToken = cookieValue;
                return true;
            }
        }
        console.log('Kein Authorization Token gefunden.');
        return false;
    }

    //ID der Schule abrufen
    function getMe() {
        return new Promise((resolve, reject) => {
            console.log("Accountdaten werden abgerufen.");
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
                    resolve(me);
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    //ID des Boards abrufen
    function getBoardId() {
        console.log("Board ID wird abgerufen.");
        var url = unsafeWindow.location.href;
        boardId = url.split('/')[4];
        console.log("ID des Boards: " + boardId);
    }

    //Layout eines beliebigen Boards abrufen
    function getBoardLayout(id) {
        return new Promise((resolve, reject) => {
            console.log("Übersicht des Boards wird abgerufen.");
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
                    console.error('Error:', error);
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
    
                    cardIds.forEach(function(cardId) {
                        getCardTextContent(cardId)
                            .then(result => {
                                promptCards[result.title] = result.allText;
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                reject(error);
                            });
                    });
                    resolve();
                })
                .catch(error => {
                    console.error('Error:', error);
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
    
                    cardIds.forEach(function(cardId) {
                        getCardTextContent(cardId)
                            .then(result => {
                                modelCards[result.title] = result.allText;
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                reject(error);
                            });
                    });
                    resolve();
                })
                .catch(error => {
                    console.error('Error:', error);
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
                            console.error('Fehler beim Abrufen des Schlüssels:', error);
                            reject(error);
                        });
                })
                .catch(error => {
                    console.error('Fehler beim Abrufen der URL:', error);
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
            console.log("Hole den Textinhalt der Karte mit der ID: " + cardId);
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
        console.log("Verbindungen werden getestet.");
        getAuthToken();
        getMe();
        console.log("Name: " + me.user.firstName + " " + me.user.lastName);
        console.log("Name der Schule: " + me.school.name);
        getBoardId();
        
    }

    function variableTests() {
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

    //System vorbereiten (wichtige Daten abrufen und speichern)
    async function prepareSystem() {
        console.log("System wird vorbereitet.");
        getBoardId();
        if (getAuthToken()) {
            await Promise.all([getMe(), saveBoardLayout(boardId), getSystemPrompts(aiBoardId), getModels(aiBoardId), getStorageData()]);
            GM_registerMenuCommand("Overlay starten", startModal);
            GM_registerMenuCommand("Test des Systems", variableTests);
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
        createStyles();
        console.log("Modal wird eingerichtet.");
        var overlay = document.createElement('div');
        overlay.id = 'modalOverlay';
        overlay.className = 'modal-overlay';
        overlay.addEventListener('click', function(event) {
            if(event.target === overlay) {
                closeModal();
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
                        console.error('Fehler bei der Zusammenstellung der Texte:', error);
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
            console.log("Ausgewählter Prompt: ", promptSelect.options[promptSelect.selectedIndex].text);
            input.value = selectedPrompt;
            sendButton.innerHTML = "Beginnen";
            
        });
        modelSelect.addEventListener('change', function() {
            selectedModel = modelSelect.options[modelSelect.selectedIndex].text;
            console.log("Ausgewähltes Modell: ", modelSelect.options[modelSelect.selectedIndex].text);
        });

        // Erstelle den Event-Listener für das Eingabefeld
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                var prompt = input.value;
                if (sendButton.innerHTML === "Beginnen") {
                    storageAPI["systemPrompt"] = prompt;
                    var dataCheckboxes = selectData.querySelectorAll('input[name="dataText"]:checked');
                    var dataText = "";
                    dataCheckboxes.forEach(function(checkbox) {
                        dataText += checkbox.value + "\n";
                    });
                    prompt = input.value.replace("[data]", dataText);
                    prompt = prompt.replace("[name]", me.user.firstName);
                    console.log("System-Prompt: ", prompt);
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
            saveChatHistoryToFile(selectedModel);
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
        console.log("Button wurde geklickt!");
        if (action === "Beginnen") {
            var text_with_name = text.replace("[name]", me.user.firstName);
            renderToModal("<b>Ein neuer Chat wird gestartet. Das Modell muss eventuell neu geladen werden.</b>", "standard", false);
            chatHistory[0] = {};
            chatHistory[0]["role"] = "system";
            chatHistory[0]["content"] = text_with_name;
            console.log("Chat-Verlauf: ", chatHistory);
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
        console.log("Request wird an die API gesendet: " + model);
        console.log("Chat-Verlauf: ", chatHistory);
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
                                    console.log("Anzahl der Tokens: " + text["eval_count"]);
                                    var tokenCount = document.getElementById('tokenCount');
                                    tokenCount.innerHTML = "Tokenanzahl: <b>" + text["eval_count"] + "</b>";
                                }
                            }
                            catch (error) {
                                console.error("Fehler beim Parsen der Antwort: ", error);
                            }
                        });

                    }

                    if (done) {
                        console.log("Stream beendet.");
                        break;
                    }
                }

            },
            onerror: function(error) {
                console.error("Fehler bei der Anfrage: ", error);
            }
        });
    }




    //Text in das Modal rendern
    function renderToModal(text, type = "standard", stream = false) {
        text = text.replace(/\n/g, "<br>");
        var modal = document.getElementById('chatMessages');
        if (!modal) {
            console.log("Modal nicht gefunden! Text konnte nicht gerendert werden.");
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

    //Modal schließen
    function closeModal() {
        var modal = document.getElementById('modal');
        modal.remove();
        var overlay = document.getElementById('modalOverlay');
        overlay.remove();
    }


    //Chatverlauf speichern
    function saveChatHistoryToFile(model) {
        var chatHistoryText = "";
        var date = new Date();
        var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        var formattedDate = date.toLocaleString('de-DE', options).split('.').reverse().join('-');
        if (chatHistory.length === 0) {
            console.log('Chatverlauf ist leer.');
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
                console.log("Chatverlauf wurde gespeichert.");
            },
            onerror: function(error) {
                console.error("Fehler beim Speichern des Chatverlaufs: ", error);
            }
        });
    

    }

    function modalChooseContent() {
        var modal = document.getElementById('modal');
        var content = document.createElement('div');
        content.id = 'modalContent';
        modal.appendChild(content);
        var html = getCardTextContent(sourceCards["content"]);
        console.log("HTML: " + html);
        content.innerHTML = html;

    }

})();