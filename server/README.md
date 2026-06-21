# TermiBoard Backend API

A real-time collaborative Kanban board API built with Fastify, Drizzle ORM, PostgreSQL, and Socket.io.

## ⚙️ Environment Variables
```env
API_ADDR=127.0.0.1
API_PORT=3001
DATABASE_URL=postgres://...
JWT_SECRET=your_jwt_secret
```

## 📡 REST API Reference
All requests must set the header `Content-Type: application/json`. Protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

### 1. Authentication Module (/api/auth)

#### 🔹 Register a New Account
 * **Endpoint**: `POST /api/auth/register`
 * **Auth Required**: No
 * **Request Body**:
```json
{
  "username": "sharif",
  "email": "sharif@example.com",
  "password": "securepassword123"
}
```
 * **Success Response (201 Created)**:
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "e4a8b792-51c3-4c4c-811a-7b3b4d4567ef",
      "username": "sharif",
      "email": "sharif@example.com",
      "createdAt": "2026-06-13T08:00:00.000Z"
    }
  }
}
```

#### 🔹 Log In to Account
 * **Endpoint**: `POST /api/auth/login`
 * **Auth Required**: No
 * **Request Body**:
```json
{
  "email": "sharif@example.com",
  "password": "securepassword123"
}
```
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "e4a8b792-51c3-4c4c-811a-7b3b4d4567ef",
      "username": "sharif",
      "email": "sharif@example.com",
      "createdAt": "2026-06-13T08:00:00.000Z"
    }
  }
}
```

### 2. Boards Module (/api/boards)
#### 🔹 Create a New Project Board
 * **Endpoint**: `POST /api/boards`
 * **Auth Required**: Yes
 * **Request Body**:
```json
{
  "name": "School Website Project",
  "description": "Optionally add description to this board"
}
```
 * **Success Response (201 Created)**:
```json
{
  "status": "success",
  "message": "Board created successfully",
  "data": {
    "board": {
      "id": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
      "name": "School Website Project",
      "description": "Optionally add description to this board",
      "createdAt": "2026-06-13T08:15:00.000Z"
    }
  }
}
```

#### 🔹 Retrieve All User Boards
 * **Endpoint**: `GET /api/boards`
 * **Auth Required**: Yes
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "boards": [
      {
        "id": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
        "name": "School Website Project",
        "description": "Optionally add description to this board",
        "createdAt": "2026-06-13T08:15:00.000Z"
      }
    ]
  }
}
```

#### 🔹 Retrieve a Single Board Detail By ID
 * **Endpoint**: `GET /api/boards/:id`
 * **Auth Required**: Yes
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "board": {
      "id": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
      "name": "School Website Project",
      "description": "Optionally add description to this board",
      "createdAt": "2026-06-13T08:15:00.000Z"
    }
  }
}
```

#### 🔹 Update Board Name or Description
 * **Endpoint**: `PATCH /api/boards/:id`
 * **Auth Required**: Yes
 * **Request Body (Partial Update)**:
```json
{
  "name": "Updated School Website Project",
  "description": "Updated description text"
}
```
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Board updated successfully",
  "data": {
    "board": {
      "id": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
      "name": "Updated School Website Project",
      "description": "Updated description text",
      "createdAt": "2026-06-13T08:15:00.000Z"
    }
  }
}
```
 * **Triggered Side Effect**: Broadcasts a WebSocket event `board_updated` to the room namespace matching the board ID.

#### 🔹 Delete a Board
 * **Endpoint**: `DELETE /api/boards/:id`
 * **Auth Required**: Yes
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Board deleted successfully"
}
```
 * **Triggered Side Effect**: Broadcasts a WebSocket event `board_deleted` to notify and force redirect all active clients viewing this channel.

#### 🔹 Invite Collaborator to a Board (Send Pending Invitation)
 * **Endpoint**: `POST /api/boards/invite`
 * **Auth Required**: Yes (Requires Active Admin or Board Owner privileges)
 * **Request Body**:
```json
{
  "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
  "email": "budi@example.com"
}
```
 * **Success Response (201 Created)**:
```json
{
  "status": "success",
  "message": "Invitation sent successfully. Waiting for user acceptance.",
  "data": {
    "member": {
      "id": "91a14cc5-9922-4412-bd73-bb66ff82cba1",
      "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
      "userId": "33a9b122-8d77-44a3-bc12-990ffde111ab",
      "role": "member",
      "status": "pending",
      "createdAt": "2026-06-13T08:57:42.000Z"
    }
  }
}
```
 * **Triggered Side Effect**: Dispatches an out-of-band WebSocket event `invitation_received` securely to the specific target user's namespace tunnel (`user_<userId>`).

#### 🔹 Accept Pending Board Invitation
 * **Endpoint**: `POST /api/boards/invite/accept`
 * **Auth Required**: Yes (Must be the user bound to the pending invitation)
 * **Request Body**:
```json
{
  "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd"
}
```
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Invitation accepted successfully. Welcome to the board workspace.",
  "data": {
    "member": {
      "id": "91a14cc5-9922-4412-bd73-bb66ff82cba1",
      "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
      "userId": "33a9b122-8d77-44a3-bc12-990ffde111ab",
      "role": "member",
      "status": "active",
      "createdAt": "2026-06-13T08:57:42.000Z"
    }
  }
}
```
 * **Triggered Side Effect**: Broadcasts a WebSocket event `member_joined` containing the activated member relation schema payload to all connected workspace channels.

#### 🔹 Reject Pending Board Invitation
 * **Endpoint**: `POST /api/boards/invite/reject`
 * **Auth Required**: Yes (Must be the user bound to the pending invitation)
 * **Request Body**:
```json
{
  "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd"
}
```
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Invitation rejected and purged from matrix records."
}
```

#### 🔹 Kick Member or Leave Board
 * **Endpoint**: `DELETE /api/boards/kick`
 * **Auth Required**: Yes (Requires Admin/Owner privileges to kick others; Any member can send their own ID to leave)
 * **Request Body**:
```json
{
  "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
  "userId": "33a9b122-8d77-44a3-bc12-990ffde111ab"
}
```
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Connection severed successfully. Member purged from board matrix.",
  "data": {
    "purgedUserId": "33a9b122-8d77-44a3-bc12-990ffde111ab"
  }
}
```
 * **Triggered Side Effect**: Broadcasts a WebSocket event `member_kicked` to force-evacuate and unmount the targeted user session inside the frontend viewport.


### 3. Columns Module (/api/columns)
> 🔐 **Security Note**: All endpoints in this module are protected by the Board Access Middleware. Users can only perform operations if they are the official Board Owner or an Active Collaborator. Unauthorized attempts will immediately yield a 403 Forbidden response.

#### 🔹 Create a New Column
 * **Endpoint**: `POST /api/columns`
 * **Auth Required**: Yes
 * **Request Body**:
```json
{
  "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
  "name": "To Do",
  "position": "1"
}
```
 * **Triggered Side Effect**: Broadcasts a WebSocket event `column_created` to all connected clients inside the matching board room.

#### 🔹 Fetch Columns Within a Board
 * **Endpoint**: `GET /api/columns/:boardId`
 * **Auth Required**: Yes
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "columns": [
      {
        "id": "aa123b45-12bc-34de-56fg-78hijk90l1m2",
        "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
        "name": "To Do",
        "position": "1",
        "createdAt": "2026-06-13T08:20:00.000Z"
      }
    ]
  }
}
```

#### 🔹 Update Column Name or Position
 * **Endpoint**: `PATCH /api/columns/:id`
 * **Auth Required**: Yes
 * **Request Body (Partial Update)**:
```json
{
  "name": "In Progress",
  "position": "2"
}
```
 * **Triggered Side Effect**: Broadcasts a WebSocket event `column_updated` to the room namespace.

#### 🔹 Delete a Column
 * **Endpoint**: `DELETE /api/columns/:id`
 * **Auth Required**: Yes
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Column deleted successfully",
  "data": {
    "column": {
      "id": "aa123b45-12bc-34de-56fg-78hijk90l1m2",
      "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
      "name": "To Do",
      "position": "1",
      "createdAt": "2026-06-13T08:20:00.000Z"
    }
  }
}
```
 * **Triggered Side Effect**: Broadcasts a WebSocket event `column_deleted` to notify clients to wipe the lane layout from their UI.

### 4. Cards Module (/api/cards)
> 🔐 **Security Note**: All endpoints in this module are protected by the Board Access Middleware. Users can only perform operations if they are the official Board Owner or an Active Collaborator. Unauthorized attempts will immediately yield a 403 Forbidden response.

#### 🔹 Create a New Task Card
 * **Endpoint**: `POST /api/cards`
 * **Auth Required**: Yes
 * **Request Body**:
```json
{
  "columnId": "aa123b45-12bc-34de-56fg-78hijk90l1m2",
  "title": "Setup WebSocket Implementation",
  "content": "Integrate real-time capabilities via socket.io gateway.",
  "position": "1"
}
```
 * **Triggered Side Effect**: Broadcasts a WebSocket event `card_created` to all clients actively viewing the parent board.

#### 🔹 Fetch Cards Within a Column
 * **Endpoint**: `GET /api/cards/:columnId`
 * **Auth Required**: Yes
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "cards": [
      {
        "id": "cc987654-32ba-cdba-feea-1234567890ab",
        "columnId": "aa123b45-12bc-34de-56fg-78hijk90l1m2",
        "title": "Setup WebSocket Implementation",
        "content": "Integrate real-time capabilities via socket.io gateway.",
        "position": "1",
        "createdAt": "2026-06-13T08:58:05.000Z"
      }
    ]
  }
}
```

#### 🔹 Update / Move a Task Card
 * **Endpoint**: `PATCH /api/cards/:id`
 * **Auth Required**: Yes
 * **Request Body (Partial Update)**:
```json
{
  "title": "Updated Task Title",
  "position": "2"
}
```
 * **Triggered Side Effect**: Broadcasts `card_moved` if `columnId` or `position` is modified. Otherwise, broadcasts `card_updated`.

#### 🔹 Delete a Task Card
 * **Endpoint**: `DELETE /api/cards/:id`
 * **Auth Required**: Yes
 * **Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Card deleted successfully",
  "data": {
    "card": {
      "id": "cc987654-32ba-cdba-feea-1234567890ab",
      "columnId": "aa123b45-12bc-34de-56fg-78hijk90l1m2",
      "title": "Setup WebSocket Implementation",
      "content": "Integrate real-time capabilities via socket.io gateway.",
      "position": "1"
    }
  }
}
```
 * **Triggered Side Effect**: Broadcasts `card_deleted` carrying the deleted card ID payload.

## ⚡ Socket.io WebSocket Gateway
The real-time ecosystem utilizes specific custom board rooms to multiplex state changes across collaborated users securely. The WebSocket Server runs seamlessly bound to the primary HTTP transport port (3001).

### Client-to-Server Actions (Inbound Events)

#### 📡 join_board
Connects an authorized socket client stream into a highly isolated space mapping a specific board entity. This prevents cross-board broadcast leaks.
 * **Payload Data Type**: string (The target UUID of the Board)
 * **Usage Example**:
```javascript
socket.emit('join_board', '7e2bb492-dac3-41c3-a178-63fffd17c7cd');
```

#### 📡 subscribe_notifications
Connects an authenticated user session to their personal real-time inbox pipe (`user_<userId>`) to capture live ecosystem notifications like pending board invites.
 * **Payload Data Type**: string (The target UUID of the authenticated User)
 * **Usage Example**:
```javascript
socket.emit('subscribe_notifications', 'e4a8b792-51c3-4c4c-811a-7b3b4d4567ef');
```


### Server-to-Client Broadcasts (Outbound Events)

#### 📋 Boards State Sync
 * **board_updated**: Fires when the parent board information (name or description) is updated by the owner.
   * *Payload*: Updated Board object.
 * **board_deleted**: Fires when the board is completely deleted by the owner.
   * *Payload*: { id: "board-uuid" }

#### 👥 Members State Sync
* **invitation_received**: Fires directly into the isolated personal user notification room when an active admin sends them a board invitation.
   * *Payload*: 
```json
{
  "message": "You have been invited to a new board matrix",
  "data": { "id": "member-uuid", "boardId": "board-uuid", "status": "pending" }
}
```

 * **member_joined**: Fires automatically to the entire board space **only after** the recipient officially triggers the accept sequence.
   * *Payload*: Full Member object with status mutated to active.
 * **member_kicked**: Fires instantly when an entity session is severed by an active administrator or triggers self-evacuation (Leave Board).
   * *Payload*:
```json
{
  "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
  "userId": "33a9b122-8d77-44a3-bc12-990ffde111ab"
}
```

#### 🏛️ Columns State Sync
 * **column_created**: Fires automatically whenever any team member spawns a new list column.
   * *Payload*: Full Column object (id, boardId, name, position, createdAt).
 * **column_updated**: Fires when a column is renamed or re-ordered layout-wise.
   * *Payload*: Updated Column object.
 * **column_deleted**: Fires when a column is dropped from the dashboard view.
   * *Payload*: Deleted Column object

#### 🃏 Cards State Sync
 * **card_created**: Fires automatically whenever any team member creates a card under an authenticated space.
   * *Payload*: Full Card object.
 * **card_moved**: Fires when a card's layout properties change (shifted sequence indexes or dropped to another track lane).
   * *Payload*: Card object containing modified structural sorting metadata.
 * **card_updated**: Fires when a card's textual metadata shifts (such as modifying title or description content) while resting on the same spatial indexes.
   * *Payload*: Card object containing modified textual fields.
 * **card_deleted**: Fires when a card is dropped from the kanban layout workspace.
   * *Payload*: Deleted Card object

## 👥 Contribution Guidelines
Contributions are always welcome! Please follow these clear steps to help maintain project sanity:
 1. Fork the upstream repository branch.
 2. Spin up a separate feature isolation patch locally: git checkout -b feat/your-awesome-feature.
 3. Commit clean code changes with strict, descriptive messaging patterns (*Semantic Commits*).
 4. Push your branch upstream: git push origin feat/your-awesome-feature.
 5. Open a formal Pull Request targeting the primary main production branch.

## 📝 Authors
 * [**SharifPoetra**](https://github.com/SharifPoetra/) - *Core Architect & Backend Developer*

## 📄 License
This software artifact is licensed under the terms of the formal **MIT License**. Check out the fully detailed copy inside the root repository [LICENSE](../LICENSE) file for deep permissions mapping.

---
