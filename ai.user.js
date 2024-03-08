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

    GM_registerMenuCommand("interne Tests starten", function() { checkForBoard(startTests); });
    GM_registerMenuCommand("Overlay starten", function() { checkForBoard(startModal); });
    GM_registerMenuCommand("Modal füllen", function() { checkForBoard(modalChooseContent); });

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
            flex: 0 0 20%;
            height: 100%;
            background-color: #f0f0f0;
        }

        .chat {
            display: flex;
            flex-direction: column;
            flex: 0 0 80%;
        }

        .chat-history {
            flex: 0 1 80%;
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

    var me = {};
    var auth_token = "";
    var board_id = "";
    const sourceCards = [];
    sourceCards["content"] = "65e9e885ebac7ab7f6482d81";


    // get the auth token
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
                break;
            }
        }
    }

    //get the school id
    function getMe() {
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
            }
        });
    }

    //Get the board id
    function getBoardId() {
        console.log("Board ID wird abgerufen.");
        var url = unsafeWindow.location.href;
        board_id = url.split('/')[4];
        console.log("ID des Boards: " + board_id);
    }

    function getBoardLayout() {
        console.log("Übersicht des Boards wird abgerufen.");
        if(!auth_token) {
            getAuthToken();
        }
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://niedersachsen.cloud/api/v3/boards/" + board_id,
            headers: {
                "Authorization": "Bearer " + auth_token
            },
            withCredentials: true,
            onload: function(response) {
                var data = JSON.parse(response.responseText);
            }
        });
    }

    function getCardTextContent(cardId) {
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
                var elements = data.data[0].elements;
                for(var i = 0; i < elements.length; i++) {
                    var element = elements[i];
                    if(element.content && element.content.text) {
                        allText += element.content.text;
                    }
                }
                console.log("Textinhalt der Karte: " + allText);
                return allText;
            }
        });
    }

 
    function startTests() {
        console.log("Verbindungen werden getestet.");
        getAuthToken();
        getMe();
        console.log("Accountname: " + me.displayName);
        console.log("Name der Schule: " + me.schoolName);
        console.log("Vorname: " + me.firstName);
        getBoardId();
        getBoardLayout();
    }

    function createStyles() {
        var styleSheet = document.createElement("style");
        styleSheet.setAttribute("type", "text/css");
        styleSheet.innerText = modalCSS;
        document.head.appendChild(styleSheet);
    }
   
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

        // Create the modal div
        var modal = document.createElement('div');
        modal.id = 'myModal';
        modal.className = 'modal';

        // Create the settings div
        var settings = document.createElement('div');
        settings.id = 'settings';
        settings.className = 'settings';

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
    }

    function closeModal() {
        var modal = document.getElementById('myModal');
        modal.remove();
        var overlay = document.getElementById('modalOverlay');
        overlay.remove();
    }

    function modalChooseContent() {
        var modal = document.getElementById('myModal');
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