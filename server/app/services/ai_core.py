import os
from huggingface_hub import InferenceClient

# Single point of initialization
client = InferenceClient()
DEFAULT_MODEL = "Qwen/Qwen2.5-7B-Instruct"

async def hf_stream_completion(messages: list, temperature: float = 0.2, max_tokens: int = 1000):
    """
    Low-level Core Generator. 
    Accepts an engineered array of messages and yields raw string tokens.
    """
    try:
        # Resolve the API key check safely
        if not os.getenv("HF_TOKEN"):
            yield "[Backend Error: HF_TOKEN is missing from server environment variables]"
            return

        stream = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )

        for chunk in stream:
            token = chunk.choices[0].delta.content
            if token:
                yield token

    except Exception as e:
        yield f"\n[Hugging Face Core Error: {str(e)}]"