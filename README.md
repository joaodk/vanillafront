Vanilla Front

a simple and lean application that includes:

-user authentication/sign-in/identity,etc through clerk
-payments and subscriptions through clerk/stripe
-a chat interface for LLMs

Purpose: to serve as a template and stepping stone for more specific applications.


Next steps:

-make it work smoothly with a custom back-end


-add tool-use and a mcp server connection

currently working on:




change the message rendering to display messages as follows - whenever the message stream shows a <think>tag, render like this - given the input "text before <think> text inside "->show like this:

text before
<details>
  <summary>Thinking...</summary>
  text inside
</details>

when the message stream closes the tag with a </think>, resume after the details block.

"text before <think> text inside </think> text after"

text before
<details>
  <summary>Reasoning</summary>
  text inside
</details>
text after


https://www.assistant-ui.com/docs/runtimes/custom/local#getting-started

expected response format:
{
  "choices": [
    {
      "delta": {
        "content": "text content",
        "tool_calls": [
          {
            "index": 0,
            "id": "tool_call_id",
            "function": {
              "name": "tool_name",
              "arguments": "{\"arg1\": \"value1\"}"
            }
          }
        ]
      }
    }
  ]
}




Text: ({ part }) => {
  // Simple string replacement for think tags
  const processedContent = String((part as any).text || '')
    .replace(/<think>/g, '<details><summary>Thinking</summary>')
    .replace(/<\/think>/g, '</details>');
  
  return (
    <div dangerouslySetInnerHTML={{ __html: processedContent }} />
  );
}