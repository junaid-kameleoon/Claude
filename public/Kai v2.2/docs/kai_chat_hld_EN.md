Definitions

- **KAI Frontend** (hereafter **Frontend**) — the client side of KAI. Responsible for the user interface, sending user requests, and displaying the streaming response.
- **KAI Python** (hereafter **Python**) — the existing Python service responsible for the AI logic: preparing the request to ChatGPT, adding the master prompt, calling the model, and receiving the response.
- **KAI microservice** (hereafter **microservice**) — a new backend service that acts as a technical layer between the Frontend and Python. It is responsible for storing chats and messages, working with the database, history pagination, session management, and proxying streaming responses.
- **KAI database** (hereafter **MongoDB**) — the MongoDB used by the microservice to store chats, messages, session history, and related technical data.  
  ❓Question: will we store this in the same MongoDB where we keep history? Or where PBX is? Do they have separate MongoDB containers?

  ❓Question: who writes the message to the DB? The **microservice** or **Python**

In the proposed scheme **Python** does not scale to multiple pods.

In **MongoDB**, messages must be stored in final, ready form. Not by tokens. The **microservice** must implement message pagination. Default sort is by creation date. No filtering. In the future, loading from an anchor may be needed for sharing a message — this must be accounted for in the current architecture so we don't have to rewrite it completely later.

The current KAI architecture assumes the frontend initiates a request to KAI Python and opens HTTP streaming, which ends upon receiving the session completion token (done). Our task is to move this logic to the KAI microservice.

In the new scheme, the Frontend opens an HTTP streaming connection to the microservice. The microservice opens an HTTP streaming connection to Python and proxies the received stream back to the Frontend. After receiving the response-completion marker, the microservice terminates **both** streaming sessions.

Shared chat. The **Owner** sends a chat to a **Participant**  
There are 3 options

- ✅ **Recommended**: We let Participants read the chat's messages but not write in the chat
- We let Participants write messages into a single shared chat. In that case we would have to open HTTP streaming for synchronization and to prevent simultaneous message sending
- We copy the chat entirely. The two chats become independent. The Owner and the Participants continue their conversations in their own chat versions independently

A user can share a chat only with people they see on the users page. A standard request for the user list.  
⚠️ Copy link and Shared message are not done in Lot1

A shared message is simply an anchor to a message.

Regenerate — erases the previous **Python** answer and sends the request again. This must be a separate endpoint in the microservice that explicitly indicates the user is regenerating the last message. Only the last messages in a chat can be regenerated

❓Question: does the microservice simply erase the last message in the DB and send Python a request to generate a message as if nothing happened?

Quick help pills — this part falls entirely on **Python**, which uses the context to generate these pills. Quick help pills are available only in new, empty chats

![][image1]

**Python** must generate the Name of chat by default from the context when a new chat is created

Files and images entered by the user are stored in media storage

Context Injection  
every time user opens kai we should re-inject the new context of where user is, even within the same chat.

❓Question: we need a format for how we collect and pass the Context to the backend

Credits  
We need to implement token usage tracking. This falls entirely on **Python**  
These don't have to be literal credits — for now, some diagnostic logging in an arbitrary format is enough

Tools

❓Question: what is this and in what format does it need to be sent to **Python**

Python has two endpoints:

- append
- regenerate
  Example append message:
  {
  "chat_id": "chat-123",
  "message_id": "msg-456",
  "user_message": {
  "text": "Explain this experiment result",
  "attachments": ["file-1", "image-2"]
  },
  "context": {
  "domain_type": "experiment",
  "domain_id": "294684",
  ... # additional fields for other domain_type values
  }
  }
  Example append message when the context has not changed:
  {
  "chat_id": "chat-123",
  "message_id": "msg-457",
  "user_message": {
  "text": "Now summarize it briefly",
  "attachments": ["file-3"]
  },
  }
  Python behavior on append
  1. Receives the chat_id and the new message.
  2. Checks whether it has an active provider_session_id for this chat_id.
  3. If the session is valid:
     - updates the context if necessary;
     - sends only the new message into the existing ChatGPT session;
     - starts streaming the response.
  4. If the session is absent (e.g. a new chat), expired, or broken: - fetches the full chat history from the microservice; Accounts for all context changes within this history. - creates a new provider session; - starts streaming the response.
     Python behavior on regenerate
  5. Receives the chat_id.
  6. Pulls the full chat history from the microservice.
  7. Excludes the last AI answer from the history
  8. Creates a new provider session and replays the chat history into the new session with all the necessary contexts.
  9. Generates a new AI answer.
  10. Stores the new chat_id -> provider_session_id mapping.
