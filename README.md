# Restate Library Documentation

`@ryujaewan/restate` is a lightweight library that simplifies state management in React applications. It enables easy sharing and updating of state across multiple components.

## Table of Contents

- [Restate Library Documentation](#restate-library-documentation)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
  - [Advanced Features](#advanced-features)
    - [Memoization](#memoization)
    - [Update Options](#update-options)
  - [API Reference](#api-reference)
    - [`restate(initialState)`](#restateinitialstate)
    - [`useUser()`](#useuser)
    - [`useUser.get()`](#useuserget)
    - [`useUser.set(newState)`](#useusersetnewstate)
  - [Examples](#examples)
    - [Multi-Component Updates](#multi-component-updates)
    - [Using `get()` and `set()`](#using-get-and-set)
  - [Bug Reports and Suggestions](#bug-reports-and-suggestions)

## Installation

```bash
npm install @ryujaewan/restate
```
or
```bash
yarn add @ryujaewan/restate
```

## Basic Usage

```typescript
// state.ts
import { restate } from '@ryujaewan/restate';

export const useUser = restate({ id: 1, name: 'John Doe' });

// UserComponent.tsx
import React from 'react';
import { useUser } from './state';

function UserComponent() {
  const [user, setUser] = useUser();
  
  return (
    <div>
      <h1>User ID: {user.id}</h1>
      <p>Name: {user.name}</p>
      <button onClick={() => setUser({ ...user, id: user.id + 1 })}>
        Increment ID
      </button>
    </div>
  );
}
```

## Advanced Features

### Memoization

Restate allows you to optimize performance by memoizing state updates:

```typescript
let [user, setUser] = useUser((prev, next) => {
  return prev.id % 2 === 0; // Component updates only when id is even
});

return (
  <h1 onClick={() => {
    setUser({
      id: Math.floor(Math.random() * 100),
    });
  }}>
    {user.id}
  </h1>
);
```

### Update Options

You can control when updates occur using the `updateOn` option:

```typescript
let [user, setUser] = useUser({ updateOn: 'topLevelChange' });

return (
  <h1 onClick={() => {
    setUser({
      id: Math.floor(Math.random() * 100),
    });
  }}>
    {user.id}
  </h1>
);
```

## API Reference

### `restate(initialState)`

Creates a new state hook.

- `initialState`: The initial state object.

Returns: A custom hook for managing state.

### `useUser()`

Custom hook created by `restate`.

Returns: An array containing the current state and a setter function.

### `useUser.get()`

Retrieves the current state without subscribing to updates.

### `useUser.set(newState)`

Updates the state and triggers re-renders in subscribed components.

- `newState`: New state object or update function.

## Examples

### Multi-Component Updates

```typescript
// ProfileComponent.tsx
import React from 'react';
import { useUser } from './state';

function ProfileComponent() {
  const [user] = useUser();
  return <p>Profile: {user.name}</p>;
}

// SettingsComponent.tsx
import React from 'react';
import { useUser } from './state';

function SettingsComponent() {
  const [user, setUser] = useUser();
  
  return (
    <button onClick={() => setUser({ ...user, name: 'Jane Doe' })}>
      Change Name
    </button>
  );
}

// App.tsx
import React from 'react';
import UserComponent from './UserComponent';
import ProfileComponent from './ProfileComponent';
import SettingsComponent from './SettingsComponent';

function App() {
  return (
    <div>
      <UserComponent />
      <ProfileComponent />
      <SettingsComponent />
    </div>
  );
}
```

In this example, when the name is changed in `SettingsComponent`, both `UserComponent` and `ProfileComponent` will automatically update to reflect the new name.

### Using `get()` and `set()`

```typescript
// NonReactiveComponent.tsx
import React from 'react';
import { useUser } from './state';

function NonReactiveComponent() {
  const handleClick = () => {
    const currentUser = useUser.get();  // This component won't re-render on state changes
    console.log("Current user:", currentUser);
    useUser.set(prevUser => ({ ...prevUser, name: 'Alice Johnson' }));
  };

  return <button onClick={handleClick}>Update User</button>;
}
```

## Bug Reports and Suggestions

If you encounter any bugs or have suggestions for improving the Restate library, please don't hesitate to reach out. We value your feedback and are committed to enhancing the library based on user experiences and needs.

Contact us at: ryujaewan123@gmail.com

Your input helps make Restate better for everyone. Thank you for your support!