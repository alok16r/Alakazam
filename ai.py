from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="YOUR_API_KEY"
)


def ask_ai_stream(messages):
    """
    Generator that yields ONLY the final answer text to the browser,
    as it streams in. This model can also emit "reasoning" content
    (its internal thinking) which we deliberately do NOT send to the
    chat UI -- that's what caused the garbled/leaked output before.
    Reasoning is printed to the terminal instead, for debugging only.
    """
    completion = client.chat.completions.create(
        model="deepseek-ai/deepseek-v4-flash",
        messages=messages,
        temperature=0.7,
        top_p=0.95,
        max_tokens=8192,
        extra_body={"chat_template_kwargs": {"thinking": True, "reasoning_effort": "low"}},
        stream=True
    )

    got_any_content = False

    for chunk in completion:
        if not getattr(chunk, "choices", None):
            continue
        if len(chunk.choices) == 0:
            continue

        delta = chunk.choices[0].delta

        reasoning_piece = getattr(delta, "reasoning_content", None) or getattr(delta, "reasoning", None)
        if reasoning_piece:
            print(reasoning_piece, end="", flush=True)

        content = getattr(delta, "content", None)
        if content:
            got_any_content = True
            yield content

    if not got_any_content:
        print("=== Model returned no visible content (only reasoning, or an empty reply) ===")
        yield "[No answer content came through — check the terminal log]"

