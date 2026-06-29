import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    api_key="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",
)

stream = client.chat.completions.create(
    model="meta-llama/Llama-3.3-70B-Instruct",
    messages=[
        {
            "role": "user",
            "content": "What do you mean by schrodinger's cat experiment?"
        }
    ],
    stream=True,
)

for chunk in stream:
    print(chunk.choices[0].delta.content, end="")