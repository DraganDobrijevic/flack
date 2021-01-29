document.addEventListener('DOMContentLoaded', () => {

    let blue = document.getElementsByClassName('blue');
    for(let i = 0; i < blue.length; i++){
        blue[i].classList.remove('blue');
    }
    
    let lastSelected = localStorage.getItem('lastSelected');
    load(lastSelected);

    // Set starting value of name to 007
    if (!localStorage.getItem('name'))
    localStorage.setItem('name', '007');

    // Load current value of name
    let displayName = document.querySelector('#display-name');
    displayName.innerHTML = localStorage.getItem('name');

    // Start animation - hello
    displayName.parentElement.style.animationPlayState = 'running';

    if (localStorage.getItem('name') != '007') {

        // Delete form
        document.querySelector('.btn').parentElement.remove();

        // Start animation - channelsA
        document.querySelector('#channels').style.animationPlayState = 'running';
    } 
    else {

        // On click get name
        document.querySelector('#form').onsubmit = () => {
        
            let name = document.querySelector('#name').value;
            console.log(name)

            // Set name
            let displayName = document.querySelector('#display-name');
            displayName.innerHTML = name;
            localStorage.setItem('name', name);

            // Start animation - hello
            displayName.parentElement.style.animationPlayState = 'running';

            // Start animation - channelsA
            document.querySelector('#channels').style.animationPlayState = 'running';

            // Delete form
            document.querySelector('.btn').parentElement.remove();

            return false;

        }
    }


    // Initialize new request
    const request = new XMLHttpRequest();
    request.open('GET', '/channelNames');

    // Callback function for when request completes
    request.onload = () => {

        // Extract JSON data from request
        const data = JSON.parse(request.responseText);

        // Update the result div
        if (data.success) {
            
            // Add all items to rooms list
            data.channelNames.forEach((item) => {

                // Template for channelName results
                const template = Handlebars.compile(document.querySelector('#result').innerHTML);
                // Add channelName results to DOM.
            
                // const channels = channelName['channelName'];
                const content = template({'value': item});
                document.querySelector('#rooms').innerHTML += content;
                
            }); 
        }
    }

    // Send request
    request.send();



    // By default, button is disabled
    document.querySelector('#new-channel').disabled = true;

    // Enable button only if there is text in the input field
    document.querySelector('#new-channel-name').onkeyup = () => {
        if (document.querySelector('#new-channel-name').value.length > 25)
            document.querySelector('#new-channel').disabled = true;
        else if (document.querySelector('#new-channel-name').value.length > 0)
            document.querySelector('#new-channel').disabled = false;
        else
            document.querySelector('#new-channel').disabled = true;
    };


    // Create new channel
    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    // When connected
    socket.on('connect', () => {

        document.querySelector('#new-channel').onclick = () => {
            let channelName = document.querySelector('#new-channel-name').value;

            // Check if it already exists
            // Initialize new request
            const request = new XMLHttpRequest();
            request.open('POST', '/check');
 
            // Callback function for when request completes
            request.onload = () => {
 
                // Extract JSON data from request
                const data = JSON.parse(request.responseText);
 
                if (data.success) {
               
                    // Clear input field and disable button again
                    document.querySelector('#new-channel-name').value = '';
                    document.querySelector('#new-channel').disabled = true;

                    // When we create a new channel, we save it to memory as the last selected channel
                    localStorage.getItem('lastSelected');
                    localStorage.setItem('lastSelected', channelName);

                    // Emit a "add channel"
                    socket.emit('add channel', {'channelName': channelName});
  
                }
                else {
                    alert('A channel with this name already exists')
                    document.querySelector('#new-channel-name').value = '';
                    document.querySelector('#new-channel').disabled = true;
                }
            }
 
            // Add data to send with request
            const data = new FormData();
            data.append('channelName', channelName);
 
            // Send request
            request.send(data);
            return false;
        };
              
      

        // When a new channel is published, add it to the unordered list
        socket.on('publish channel', (channelName) => {

            // Template for channelName results
            const template = Handlebars.compile(document.querySelector('#result').innerHTML);

            // Add channelName results to DOM
            const content = template({'value': channelName['channelName']});
            document.querySelector('#rooms').innerHTML += content;

        });
    });

    

    document.addEventListener('mouseup', event => {

        const element = event.target;
        console.log(element.className)
        
        if (element.className === 'channel-link') {
            const page = element.dataset.page;
            let channelName = page;

            // When we select a channel, we save that channel in local storage memory as last selected channel
            localStorage.getItem('lastSelected');
            localStorage.setItem('lastSelected', channelName);

            // Set color for selected link
            let blue = document.getElementsByClassName('blue');
            for(let i=0; i< blue.length; i++){
                blue[i].classList.remove('blue');
            }
            element.classList.add("blue");

            let name = page;
            load(name);

        }

        // Hide message
        if (element.className === 'hide-btn') {
            element.parentElement.style.animationPlayState = 'running';
            element.parentElement.addEventListener('animationend', () => {
                element.parentElement.remove();
            });  
        }
    });


    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);  

    // By default, button is disabled
    document.querySelector('.send').disabled = true;

    // Enable button only if there is text in the input field
    document.querySelector('#new-msg').onkeyup = () => {
        if (document.querySelector('#new-msg').value.length > 200)
            document.querySelector('.send').disabled = true;
        else if (document.querySelector('#new-msg').value.length > 0)
            document.querySelector('.send').disabled = false;
        else
            document.querySelector('.send').disabled = true;
    };

    // Connection for sending msg
    socket.on('connect', () => {
        document.querySelector('.send').onclick = () => {
            
            const request = new XMLHttpRequest();
            request.open('POST', '/send_msg');
            request.onload = () => {

                // Extract JSON data from request
                const data = JSON.parse(request.responseText);
     
                let msg = data.sendmsg;
                let timestamp = data.timestamp;
                let name = localStorage.getItem('name');
                let channelName = localStorage.getItem('lastSelected');
            
                let max100 = data.max100;
                if (max100 == 300) {
                    document.querySelector(".post").remove();
                }
                
                socket.emit('emit_msg', {'msg': msg}, {'timestamp': timestamp}, {'name': name}, {'channelName': channelName});

            };

            // Stop sending if the message is empty
            let text = document.querySelector("#new-msg").value;
            if (text == "") {
                return false;
            }

            let name = localStorage.getItem('name');
            let channelName = localStorage.getItem('lastSelected');

            // Add data to send with request
            const data = new FormData();
            data.append('text', text);
            data.append('name', name);
            data.append('channelName', channelName);

            // Send request
            request.send(data);
            document.querySelector('#new-msg').value = "";

            return false;
        }
     
        socket.on('publish msg', (msg) => {

            if (msg.channelName['channelName'] === localStorage.getItem('lastSelected')) {
                const template2 = Handlebars.compile(document.querySelector('#result2').innerHTML);
                const content = template2({'value1': msg.msg['msg'], 'value2': msg.timestamp['timestamp'], 'value3': msg.name['name']});
                document.querySelector('#message').innerHTML += content; 

                var objDiv = document.querySelector("#message");
                objDiv.scrollTo(0, objDiv.scrollHeight);
            } 

        });
    });


    function load(page) {
    
        let name = page;
        const request = new XMLHttpRequest();
        request.open('POST', '/msg');
        request.onload = () => {
            // Extract JSON data from request
            const data = JSON.parse(request.responseText);
        
            if (data.success) {
                document.querySelector('#message').innerHTML = '';
                for (let i = 0; i < data.channelMsg.length; i+=3) {
                    let item1 = data.channelMsg[i];
                    let item2 = data.channelMsg[i+1];
                    let item3 = data.channelMsg[i+2];
                    const template2 = Handlebars.compile(document.querySelector('#result2').innerHTML);
                    const content = template2({'value1': item1, 'value2': item2, 'value3': item3});
                    document.querySelector('#message').innerHTML += content;
                }
                
                var objDiv = document.querySelector("#message");
                objDiv.scrollTo(0, objDiv.scrollHeight);
            }
        };
        
        // Add data to send with request
        const data = new FormData();
        data.append('name', name);
        
        // Send request
        request.send(data);
        return false;
        
    }
                
});




