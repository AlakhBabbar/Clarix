import os
from huggingface_hub import InferenceClient

# Single point of initialization
client = InferenceClient()
# Prioritized list of models (Primary -> Backup 1 -> Backup 2)
MODELS_POOL = [
    "google/gemma-4-31B-it",
    "Qwen/Qwen3.6-35B-A3B",
    "meta-llama/Llama-4-Scout-17B-16E-Instruct",
]

async def hf_stream_completion(messages: list, temperature: float = 0.2, max_tokens: int = 1000):
    """
    Low-level Core Generator. 
    Accepts an engineered array of messages and yields raw string tokens.
    """
    # Resolve the API key check safely
    if not os.getenv("HF_TOKEN"):
        yield "[Backend Error: HF_TOKEN is missing from server environment variables]"
        return

    # Iterate through our pool of models
    for model in MODELS_POOL:
        try:
            print(model)
            stream = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )


            # Attempt to stream the response
            for chunk in stream:
                token = chunk.choices[0].delta.content
                if token:
                    yield token
            
            # If the stream finishes successfully, break out of the loop completely
            return

        except Exception as e:
            # Check if this was our last fallback option
            if model == MODELS_POOL[-1]:
                yield f"\n[Hugging Face Core Error: All models in the pool failed. Last error: {str(e)}]"
            else:
                # Silently catch the error and let the loop try the next model
                print(f"Model {model} failed with error: {str(e)}. Switching to fallback...")
                continue