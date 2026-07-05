from flask import Flask, render_template, request, Response, stream_with_context
from ai import ask_ai_stream

app = Flask(__name__)

conversation = [
    {
        "role": "system",
        "content": "You are a helpful AI assistant. Answer clearly and concisely."
    }
]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "").strip()

    if not message:
        return Response("", mimetype="text/plain")

    conversation.append({"role": "user", "content": message})

    def generate():
        full_reply = ""
        try:
            for token in ask_ai_stream(conversation):
                full_reply += token
                yield token
        finally:
            
            if full_reply:
                conversation.append({"role": "assistant", "content": full_reply})


    return Response(stream_with_context(generate()), mimetype="text/plain")


if __name__ == "__main__":
    
    app.run(debug=True, threaded=True)

