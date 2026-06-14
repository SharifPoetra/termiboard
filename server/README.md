# TermiBoard Backend

A real-time collaborative Kanban board API built with Fastify, Drizzle ORM, PostgreSQL, and Socket.io.

## ⚙️ Environment Variables
```env
API_ADDR=127.0.0.1
API_PORT=3001
DATABASE_URL=postgres://...
JWT_SECRET=your_jwt_secret
```

## 📡 REST API Reference
All requests must set the header Content-Type: application/json. Protected endpoints require an Authorization: Bearer <JWT_TOKEN> header.

### 1. Authentication Module (/api/auth)
#### 🔹 Register a New Account
 * **Endpoint**: POST /api/auth/register
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
 * **Endpoint**: POST /api/auth/login
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

```

### 2. Boards Module (/api/boards)
#### 🔹 Create a New Project Board
 * **Endpoint**: POST /api/boards
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
 * **Endpoint**: GET /api/boards
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

#### 🔹 Invite Collaborator to a Board
 * **Endpoint**: POST /api/boards/invite
 * **Auth Required**: Yes
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
  "message": "Member added successfully to the board",
  "data": {
    "member": {
      "id": "91a14cc5-9922-4412-bd73-bb66ff82cba1",
      "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
      "userId": "33a9b122-8d77-44a3-bc12-990ffde111ab",
      "role": "member",
      "createdAt": "2026-06-13T08:57:42.000Z"
    }
  }
}

```

### 3. Columns Module (/api/columns)
#### 🔹 Create a New Column
 * **Endpoint**: POST /api/columns
 * **Auth Required**: Yes
 * **Request Body**:
```json
{
  "boardId": "7e2bb492-dac3-41c3-a178-63fffd17c7cd",
  "title": "To Do",
  "position": "1"
}

```
#### 🔹 Fetch Columns Within a Board
 * **Endpoint**: GET /api/columns/:boardId
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
        "title": "To Do",
        "position": "1",
        "createdAt": "2026-06-13T08:20:00.000Z"
      }
    ]
  }
}

```

### 4. Cards Module (/api/cards)
#### 🔹 Create a New Task Card
 * **Endpoint**: POST /api/cards
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
 * **Endpoint**: GET /api/cards/:columnId
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
 * **Endpoint**: PATCH /api/cards/:id
 * **Auth Required**: Yes
 * **Request Body (Partial Update)**:
```json
{
  "title": "Updated Task Title",
  "position": "2"
}
```
* **Triggered Side Effect**: Broadcasts `card_moved` if `columnId` or `position` is modified. Otherwise, broadcasts `card_updated`.

## ⚡ Socket.io WebSocket Gateway
The real-time ecosystem utilizes specific custom rooms to multiplex state changes across collaborated users securely. WebSocket Server runs seamlessly bound to the primary HTTP transport port (3001).

### Client-to-Server Actions (Inbound Events)
#### 📡 join_board
Connects an authorized socket client stream into a highly isolated space mapping a specific board entity. This prevents cross-board broadcast leaks.
 * **Payload Data Type**: string (The target UUID of the Board)
 * **Usage Example**:
```javascript
socket.emit('join_board', '7e2bb492-dac3-41c3-a178-63fffd17c7cd');

```

### Server-to-Client Broadcasts (Outbound Events)
#### 🔔 card_created
Fires automatically whenever any team member creates a card through the REST HTTP endpoint under an authenticated space.
 * **Broadcast Range**: Distributed strictly to clients grouped inside the matching Board Room.
 * **Payload Schema**:
```json
{
  "id": "cc987654-32ba-cdba-feea-1234567890ab",
  "columnId": "aa123b45-12bc-34de-56fg-78hijk90l1m2",
  "title": "Setup WebSocket Implementation",
  "content": "Integrate real-time capabilities via socket.io gateway.",
  "position": "1",
  "createdAt": "2026-06-13T08:58:05.000Z"
}
```

#### 🔄 card_moved
Fires automatically when a card's layout layout changes (shifted inside a column or dragged to another column).
 * **Payload Schema**: Card object containing new columnId or position.
#### ✏️ card_updated
Fires when a card's textual metadata changes (like updating title or content) without changing its structural sequence.
 * **Payload Schema**: Card object containing modified textual fields.

---

## 👥 Contribution Guidelines
Contributions are always welcome! Please follow these clear steps to help maintain project sanity:
 1. Fork the upstream repository branch.
 2. Spin up a separate feature isolation patch locally: git checkout -b feat/your-awesome-feature.
 3. Commit clean code changes with strict, descriptive messaging patterns.
 4. Push your branch upstream: git push origin feat/your-awesome-feature.
 5. Open a formal Pull Request targeting the primary main production branch.

## 📝 Authors
 * [**SharifPoetra**](https://github.com/SharifPoetra/) - *Core Architect & Backend Developer*

## 📄 License
This software artifact is licensed under the terms of the formal **MIT License**. Check out the fully detailed copy inside the root repository [LICENSE](LICENSE) file for deep permissions mapping.

---
