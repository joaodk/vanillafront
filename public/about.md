

### Technical Implementation

I've defined a custom tool and prompt, guiding the LLM to provide structured output for research assistance. For this demo, I'm using:

- **Model**: Groq's OpenAI/GPT-OSS-120B
- **Performance**: ~500 tokens/second
- **Cost**: This default text should cost less than $0.01
- **Optimization**: Request caching to avoid draining API limits
