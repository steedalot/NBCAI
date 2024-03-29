// ==UserScript==
// @name         NBCAI
// @namespace    YourNamespace
// @version      0.1
// @description  Adding an AI assistant to the NBC
// @author       Frustrated user
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

        .chat-history {
            flex: 0 1 80%;
            padding: 10px;
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
        }

        .send-button {
            background-color: #4CAF50;
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
            position: absolute;
            bottom: 20px;
            left: 20px;
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
    var auth_token = "";
    var board_id = "";
    var board_layout = {};
    var prompt_cards = [];
    var model_cards = [];
    var chat_history = [];



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
                auth_token = cookieValue;
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
                    "Authorization": "Bearer " + auth_token
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
        board_id = url.split('/')[4];
        console.log("ID des Boards: " + board_id);
    }

    //Layout eines beliebigen Boards abrufen
    function getBoardLayout(id) {
        return new Promise((resolve, reject) => {
            console.log("Übersicht des Boards wird abgerufen.");
            if(!auth_token) {
                getAuthToken();
            }
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://niedersachsen.cloud/api/v3/boards/" + id,
                headers: {
                    "Authorization": "Bearer " + auth_token
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
                    board_layout = data;
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
                                prompt_cards[result.title] = result.allText;
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
                                model_cards[result.title] = result.allText;
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

    //kompletten Textinhalt einer Karte abrufen
    function getCardTextContent(cardId) {
        return new Promise((resolve, reject) => {
            if(!auth_token) {
                getAuthToken();
            }
            console.log("Hole den Textinhalt der Karte mit der ID: " + cardId);
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://niedersachsen.cloud/api/v3/cards?ids=" + cardId,
                headers: {
                    "Authorization": "Bearer " + auth_token
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
                    var clearedText = allText.replace(/<[^>]*>?/gm, '');
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
        console.log("Accountname: " + me.displayName);
        console.log("Name der Schule: " + me.schoolName);
        console.log("Vorname: " + me.firstName);
        getBoardId();
        
    }

    function variableTests() {
        console.log("Accountdaten: ", me);
        console.log("Authorization Token: ", auth_token);
        console.log("Board ID: ", board_id);
        console.log("Board Layout: ", board_layout);
        console.log("Prompt Cards:");
        for (var key in prompt_cards) {
            console.log("Prompt: " + key + " - Text: " + prompt_cards[key]);
        }
        console.log("Model Cards:");
        for (var key in model_cards) {
            console.log("Model: " + key + " - Text: " + model_cards[key]);
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
            await Promise.all([getMe(), saveBoardLayout(board_id), getSystemPrompts(aiBoardId), getModels(aiBoardId)]);
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
                ${Object.keys(prompt_cards).map(title => `<option value="${prompt_cards[title]}">${title}</option>`).join('')}
            </select>
            <br>
            <br>
            Wähle ein Modell aus:<br>
            <select id="modelSelect" style="all: revert;">
                ${Object.keys(model_cards).map(title => `<option value="${model_cards[title]}">${title}</option>`).join('')}
            </select>
        `;
        var selected_model = Object.values(model_cards)[0];


        //Create the reset button
        var resetButton = document.createElement('button');
        resetButton.innerHTML = 'Reset';
        resetButton.className = 'reset-button';
        resetButton.id = 'resetButton';

        //Create the token count div
        var tokenCount = document.createElement('div');
        tokenCount.id = 'tokenCount';
        tokenCount.className = 'tokencount';

        //Create the chat div
        var chat = document.createElement('div');
        chat.id = 'chat';
        chat.className = 'chat';
        
        // Create the chat history div
        var chatHistory = document.createElement('div');
        chatHistory.id = 'chatHistory';
        chatHistory.className = 'chat-history';

        // Create the input div
        var inputArea = document.createElement('div');
        inputArea.id = 'inputArea';
        inputArea.className = 'input-area';

        // Create the input field
        var inputField = document.createElement('div');
        inputField.id = 'inputField';
        inputField.className = 'input-field';

        var input = document.createElement('textarea');
        input.id = 'input';
        input.value = Object.values(prompt_cards)[0];
        input.className = 'input';



        inputField.appendChild(input);

        var sendButtonField = document.createElement('div');
        sendButtonField.id = 'sendButtonField';
        sendButtonField.className = 'send-button-field';

        var sendButton = document.createElement('button');
        sendButton.innerHTML = 'Beginnen';
        sendButton.className = 'send-button';
        sendButton.id = 'sendButton';

        sendButtonField.appendChild(sendButton);
        settings.appendChild(resetButton);
        settings.appendChild(tokenCount);

        inputArea.appendChild(inputField);
        inputArea.appendChild(sendButtonField);

        chat.appendChild(chatHistory);
        chat.appendChild(inputArea);

        modal.appendChild(settings);
        modal.appendChild(chat);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        //Create the event listeners for the settings
        var promptSelect = document.getElementById('promptSelect');
        var modelSelect = document.getElementById('modelSelect');
        promptSelect.addEventListener('change', function() {
            var selected_prompt = promptSelect.options[promptSelect.selectedIndex].value;
            console.log("Selected Prompt: ", promptSelect.options[promptSelect.selectedIndex].text);
            input.value = selected_prompt;
            
        });
        modelSelect.addEventListener('change', function() {
            selected_model = modelSelect.options[modelSelect.selectedIndex].value;
            console.log("Selected Model: ", modelSelect.options[modelSelect.selectedIndex].text);
        });

        //Create the event listener for the input field
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                buttonClicked(sendButton.innerHTML, input.value);
                sendButton.innerHTML = "Senden";
                input.value = "";
            }
            else {
                countTokens(input.value);
            }
        });


        //Create the event listener for the reset button
        resetButton.addEventListener('click', function() {
            chat_history = [];
            renderToModal("");
            promptSelect.selectedIndex = 0;
            modelSelect.selectedIndex = 0;
            input.value = Object.values(prompt_cards)[0];
            sendButton.innerHTML = "Beginnen";
        });


        //Create the event listener for the send button
        sendButton.addEventListener('click', function() {
            buttonClicked(sendButton.innerHTML, input.value);
            sendButton.innerHTML = "Senden";
            input.value = "";
        });

        
    }

    //count number of tokens
    function countTokens(input) {
        var all_text = chat_history.map(obj => Object.values(obj)[0]).join(' ');
        all_text += input;
        var counted_tokens = all_text.split(' ').length * 1.2;
        var tokenCount = document.getElementById('tokenCount');
        tokenCount.innerHTML = "Tokenanzahl (grob): <b>" + Math.round(counted_tokens) + "</b>";
    }

    //send button is clicked
    function buttonClicked(action, text) {
        console.log("Button clicked!");
        if (action === "Beginnen") {
            var text_with_name = text.replace("[name]", me.user.firstName);
            chat_history[0] = {};
            chat_history[0]["system"] = text_with_name;
            console.log("Chat History: ", chat_history);
            //send first message to api
        }
        else if (action === "Senden") {
            chat_history[chat_history.length] = {};
            chat_history[chat_history.length-1]["user"] = text;
            console.log("Chat History: ", chat_history);
            //send next message to api
        }
    }

    //send message to the LLM API


    //Text in das Modal rendern
    function renderToModal(text) {
        var modal = document.getElementById('chatHistory');
        if (!modal) {
            console.log("Modal nicht gefunden! Text konnte nicht gerendert werden.");
        }
        else {
            var message = document.getElementById('modalText');
            if (!message) {
                var message = document.createElement('div');
                message.id = 'modalText';
                modal.appendChild(message);
            }
            message.innerHTML = text;
            
        }
    }

    //Modal schließen
    function closeModal() {
        var modal = document.getElementById('modal');
        modal.remove();
        var overlay = document.getElementById('modalOverlay');
        overlay.remove();
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

    function createAndInsertButton() {
        // Locate the existing button
        let existingButton = document.querySelector('[data-testid="board-menu-button"]');

        if (existingButton) {
            // Create a new button
            let newButton = document.createElement('button');
            newButton.innerHTML = '🤖'; // Robot emoji
            newButton.classList.add("v-btn", "v-btn--icon", "v-btn--round", "theme--light", "v-size--default");

            // Add event listener for the fetchData function
            newButton.addEventListener('click', startTests);

            // Insert the new button before the existing button
            existingButton.parentNode.insertBefore(newButton, existingButton);

            console.log("Button created!");
        }
    }


    









})();