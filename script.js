const chatBox = document.getElementById("chat-box");
const input = document.getElementById("message");
const sendBtn = document.getElementById("send-btn");

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendUserMessage(text) {
    const el = document.createElement("div");
    el.className = "msg user";
    el.innerHTML = `
        <div class="bubble">${escapeHtml(text)}</div>
        <div class="avatar user-avatar">You</div>
    `;
    chatBox.appendChild(el);
    scrollToBottom();
}

function appendAiPlaceholder() {
    const el = document.createElement("div");
    el.className = "msg ai";
    const id = "ai-" + Date.now();
    el.id = id;
    el.innerHTML = `
        <div class="avatar ai-avatar">A</div>
        <div class="bubble">
            <span class="typing"><span></span><span></span><span></span></span>
        </div>
    `;
    chatBox.appendChild(el);
    scrollToBottom();
    return el.querySelector(".bubble");
}

async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    input.value = "";
    sendBtn.disabled = true;

    appendUserMessage(message);
    const bubble = appendAiPlaceholder();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        if (!response.ok || !response.body) {
            bubble.textContent = "Something went wrong. Please try again.";
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let firstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (firstChunk) {
                bubble.innerHTML = "";
                firstChunk = false;
            }

            fullText += decoder.decode(value, { stream: true });
            bubble.innerHTML = marked.parse(fullText);
            scrollToBottom();
        }

        if (!fullText) {
            bubble.textContent = "No response received.";
        }

    } catch (err) {
        bubble.textContent = "Connection error. Please try again.";
    } finally {
        sendBtn.disabled = false;
        input.focus();
    }
}

input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") sendMessage();
});

