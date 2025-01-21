class Chat {
    el;
    messagesDiv;
    sendBtn;
    messageInput;

    company;
    usertype
    userid;
    username;

    constructor(el) {
        this.el = el;
        this.messagesDiv = el.querySelector('.messages');
        this.sendBtn = el.querySelector('.send-btn');
        this.messageInput = el.querySelector('.message-input');

        this.company = el.getAttribute('data-company');
        this.usertype = el.getAttribute('data-usertype');
        this.userid = el.getAttribute('data-userid');
        this.username = el.getAttribute('data-username');

        this.sendBtn.setAttribute('disabled', 'disabled');
    }

    init() {
        // activate send button
        this.sendBtn.removeAttribute('disabled');
        this.sendBtn.addEventListener('click', () => { this.submitMessage(); });
        this.messageInput.addEventListener('keydown', (e) => {
            if(e.keyCode == 13) {
                this.submitMessage();
                e.preventDefault();
            };
        });
    }

    submitMessage() {
        const message = this.messageInput.value;
        if (message.trim() === "") return; // Don't send empty messages

        var evt = new CustomEvent("sendMessage", { detail: {
                "type": "message",
                "company": this.company,
                "usertype": this.usertype,
                "userid": this.userid,
                "username": this.username,
                "message": message
            } });
        document.dispatchEvent(evt);

        this.messageInput.value = ''; // Clear the input after sending
    }

    displayMessage( message ) {
        if ( message.company !== this.company ) return;

        let msgDiv = document.createElement('div');
        msgDiv.classList.add('message',message.usertype == this.usertype ? 'you' : 'other');
        msgDiv.innerHTML = `
            <div class="message-info">
                <span class="message-info-date">${message.date}</span>
                <span class="message-info-username">${message.username}</span>
            </div>
            <div class="message-text">${message.message}</div>
        `;

        this.messagesDiv.appendChild(msgDiv);

        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }

}


function initChats() {

    // Recover Chats
    let chats = new Set();

    const els = document.getElementsByClassName('chat-container');
    for ( let el of els ) chats.add( new Chat(el) );

    // start websocket
    const ws = new WebSocket('wss://simplechatbot-670i.onrender.com');

    //ws.onerror = (e) => { console.log('error !'); console.log(e); };

    ws.onopen = () => {
        console.log('Connected to the server');

        // listen to local messages
        document.addEventListener("sendMessage", (e) => {
            console.log('ready to send message: ' + e.detail);
            ws.send( JSON.stringify(e.detail) );
        })

        // listen to remote messages
        ws.onmessage = (event) => {
            console.log('received message');
            if (event.data instanceof Blob) {
                // Convert Blob to string
                const reader = new FileReader();
                reader.onload = function () {
                    const text = reader.result;
                    const message = JSON.parse(text);
                    console.log(message);
                    chats.forEach( (c) => { c.displayMessage(message); } );
                };
                reader.readAsText(event.data);
            } else {
                const message = JSON.parse(event.data);
                console.log(message);
                chats.forEach( (c) => { c.displayMessage(message); } );
            }
        };


        // init chats
        chats.forEach( (c) => {
            c.init();
            console.log('initiating chat for company: ' + c.company );
            ws.send(JSON.stringify({ "type": "init", "company": c.company }));
        });

    }

}


document.addEventListener('DOMContentLoaded', function(event) {
    console.log('starting chat');
    initChats();
});