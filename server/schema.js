const { buildSchema } = require('graphql');

const schema = buildSchema(`
    type Subscription {
        addedUser: User
        deletedUser: User
        addedTodo: Todo
        deletedTodo: Todo
        didUndidTodo: Todo
        setTextTodo: Todo
    }

    type User {
        id: ID
        username: String
        age: Int
        todos: [Todo]
    }

    type Todo {
        id: ID
        text: String
        done: Boolean
        userId: ID
    }

    input UserInput {
        id: ID
        username: String!
        age: Int!
        todos: [TodoInput]
    }

    input TodoInput {
        id: ID
        text: String!
        done: Boolean
        userId: ID!
    }

    type Query {
        users: [User]
        user(id: ID): User
        todos: [Todo]
        todo(id: ID): Todo
    }

    type Mutation {
        addUser(user: UserInput): User
        deleteUser(id: ID): User
        addTodo(todo: TodoInput): Todo
        deleteTodo(id: ID): Todo
        doUndoTodo(id: ID, done: Boolean): Todo
        setTextTodo(id: ID, text: String): Todo
    }
`);

module.exports = schema;
