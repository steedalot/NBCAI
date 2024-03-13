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
    var promptCards = [];



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
                url: "https://niedersachsen.cloud/api/v1/me",
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
                    resolve({allText: allText, title: title});
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
        for (var key in promptCards) {
            console.log("Prompt: " + key + " - Text: " + promptCards[key]);
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
            await Promise.all([getMe(), saveBoardLayout(board_id), getSystemPrompts(aiBoardId)]);
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
            <b>Einstellungen</b><br>
            <br>
            Wähle einen Prompt aus:<br>
            <br>
            <select id="promptSelect" style="all: revert;">
                ${Object.keys(promptCards).map(title => `<option value="${promptCards[title]}">${title}</option>`).join('')}
            </select>
        `

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
        input.className = 'input';

        inputField.appendChild(input);

        var sendButtonField = document.createElement('div');
        sendButtonField.id = 'sendButtonField';
        sendButtonField.className = 'send-button-field';

        var sendButton = document.createElement('button');
        sendButton.innerHTML = 'Senden';
        sendButton.className = 'send-button';
        sendButton.id = 'sendButton';

        sendButtonField.appendChild(sendButton);

        inputArea.appendChild(inputField);
        inputArea.appendChild(sendButtonField);

        chat.appendChild(chatHistory);
        chat.appendChild(inputArea);

        modal.appendChild(settings);
        modal.appendChild(chat);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        renderToModal("Hallo " + me.firstName + "! Wie geht es dir heute?");
    }

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
            }
            message.innerHTML = text;
            modal.appendChild(message);
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