// ==UserScript==
// @name         NBCAI
// @namespace    YourNamespace
// @version      0.1
// @description  Adding an AI assistant to the NBC
// @author       Frustrated user
// @match        https://niedersachsen.cloud/rooms/*/board
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @require
// ==/UserScript==


(function() {
    'use strict';

    console.log("At least it works...");
    setTimeout(createAndInsertButton, 7000);

    var school_id = "";

    function addModalStyles() {
        var css = `
            .modal-overlay {
                display: none; /* Hidden by default */
                position: fixed; /* Stay in place */
                z-index: 100; /* Sit on top */
                left: 0;
                top: 0;
                width: 100%; /* Full width */
                height: 100%; /* Full height */
                overflow: auto; /* Enable scroll if needed */
                background-color: rgba(0,0,0,0.4); /* Black with opacity for the overlay */
            }

            .modal {
                background-color: #fff;
                z-index: 101;
                margin: 5% auto; /* 15% from the top and centered */
                padding: 20px;
                border: 1px solid #ccc; /* Thin grey border */
                border-radius: 5px; /* Slightly rounded edges */
                width: 80%;
                height: 80%;
                overflow-y: auto; /* Enable vertical scroll inside the modal */
                display: flex;
                flex-direction: column; /* Stack children vertically */
            }
            .chat-container {
                border: 1px solid #ccc;
                padding: 10px;
                margin-bottom: 20px;
                height: 60%; /* Adjust as needed */
                overflow-y: auto; /* Scrollable */
            }
            .input-container {
                display: flex;
                justify-content: space-between;
                padding: 10px;
            }
            .ai-message {
                background-color: #e0e0e0;
                padding: 5px 10px;
                margin: 5px 0;
                border-radius: 5px;
            }
            .user-input {
                width: calc(100% - 60px); /* Adjust width as needed */
                padding: 5px;
                margin: 5px 0;
                box-sizing: border-box; /* Ensures padding doesn't add to the width */
                flex-grow: 1; /* Allow input to take up available space */
                margin-right: 10px; /* Space between input and button */
            }
        `;

        var styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = css;
        document.head.appendChild(styleSheet);
    }

    // Call the function to add styles
    addModalStyles();


    function createModal() {
        // Create the overlay div
        console.log("Creating modal!");
        var overlay = document.createElement('div');
        overlay.id = 'modalOverlay';
        overlay.className = 'modal-overlay';

        // Create the modal div
        var modal = document.createElement('div');
        modal.id = 'myModal';
        modal.className = 'modal';

        // Add content to the modal (e.g., text, buttons)
        var content = document.createElement('p');
        content.style.fontSize="24px";
        content.style.fontWeight="bold";
        content.style.textAlign="center";
        content.textContent = '🤖 KI-Tutor';
        modal.appendChild(content);

        var closeButton = document.createElement('button');
        closeButton.textContent = 'KI-Tutor schließen';
        closeButton.onclick = function() { overlay.style.display = 'none'; };
        modal.appendChild(closeButton);

        // Create chat container
        var chatContainer = document.createElement('div');
        chatContainer.id = 'chatContainer';
        chatContainer.className = 'chat-container';
        modal.appendChild(chatContainer);

        // Create input container
        var inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';

        // Create user input box
        var userInput = document.createElement('input');
        userInput.id = 'userInput';
        userInput.className = 'user-input';
        userInput.setAttribute('type', 'text');
        userInput.setAttribute('placeholder', 'Tippe hier deine Antwort ein.');
        inputContainer.appendChild(userInput);

        // Create send button
        var sendButton = document.createElement('button');
        sendButton.textContent = 'Senden';
        // ... Add event listener for sendButton ...
        inputContainer.appendChild(sendButton);

        // Append the modal to the overlay, and then the overlay to the body
        modal.appendChild(inputContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    function typeMessage(message, containerId, interval) {
        let container = document.getElementById(containerId);
        let index = 0;
        let typingInterval = setInterval(function() {
            if (index < message.length) {
                container.textContent += message.charAt(index);
                index++;
            } else {
                clearInterval(typingInterval);
            }
        }, interval);
    }

    // Function to open the modal
    function openModal() {
        console.log("Opening Modal");
        var modalOverlay = document.getElementById('modalOverlay');
        if (!modalOverlay) {
            createModal();
            modalOverlay = document.getElementById('modalOverlay');
        }
        modalOverlay.style.display = 'block';
        
        var chatContainer = document.getElementById('chatContainer');
        chatContainer.textContent = '';

        typeMessage("Willkommen beim KI-Tutor! Was ist die Formel für die Beschleunigung?", "chatContainer", 100); // Adjust typing speed with interval
    }

    // Add the openModal function to your existing button's event listener
    var yourButton = document.querySelector('[data-testid="board-menu-button"]');
    if (yourButton) {
        yourButton.addEventListener('click', openModal);
    }

    

// Remember to include your CSS as well


    function createAndInsertButton() {
        // Locate the existing button
        let existingButton = document.querySelector('[data-testid="board-menu-button"]');

        if (existingButton) {
            // Create a new button
            let newButton = document.createElement('button');
            newButton.innerHTML = '🤖'; // Robot emoji
            newButton.classList.add("v-btn", "v-btn--icon", "v-btn--round", "theme--light", "v-size--default");

            // Add event listener for the fetchData function
            newButton.addEventListener('click', openModal);

            // Insert the new button before the existing button
            existingButton.parentNode.insertBefore(newButton, existingButton);

            console.log("Button created!");
        }
    }


    









})();