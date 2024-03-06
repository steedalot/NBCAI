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
    var auth_token = "";

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

    

 
    function startTests() {
        console.log("Starting tests...");
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://niedersachsen.cloud/api/v1/me",
            headers: {
                "Authorization": "Bearer " + auth_token
            },
            withCredentials: true,
            onload: function(response) {
                console.log(response.responseText);
                var data = JSON.parse(response.responseText);
                school_id = data.schoolID;
                console.log("ID der Schule: " + school_id)
            }
        });
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