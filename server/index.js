const express = require('express');
const { graphqlHTTP } = require('express-graphql');

const cors = require('cors');
const schema = require('./schema');

let users = [];
let todos = [];
let userCounter = 1;
let todoCounter = 1;

const app = express();
app.use(cors());

const root = {
    users: () => {
        let r = [];

        for (const user of users) {
            r.push({ ...user, ...{ todos: todos.filter((todo) => todo.userId == user.id) } });
        }

        return r;
    },
    user: ({ id }) => ({ ...users.find((user) => user.id == id), ...{ todos: todos.filter((todo) => todo.userId == id) } }),
    addUser: ({ user }) => {
        const newUser = { ...user, ...{ id: userCounter++ } };
        users.push(newUser);
        return { ...newUser, ...{ todos: [] } };
    },
    deleteUser: ({ id }) => {
        const u = users.find((user) => user.id == id);
        const r = { ...u, ...{ todos: todos.filter((todo) => todo.userId == u.id) } };
        users = users.filter((user) => user.id != id);
        todos = todos.filter((todo) => todo.userId != u.id);
        return r;
    },
    todos: () => todos,
    todo: ({ id }) => todos.find((todo) => todo.id == id),
    addTodo: ({ todo }) => {
        if (!todo.done) {
            todo.done = false;
        }
        todo.id = todoCounter++;
        todos.push(todo);
        return todo;
    },
    deleteTodo: ({ id }) => {
        r = todos.find((todo) => todo.id == id);
        todos = todos.filter((todo) => todo.id != id);
        return r;
    },
    doTodo: ({ id }) => {
        let r = null;
        for (const todo of todos) {
            if (todo.id == id) {
                todo.done = true;
                r = todo;
            }
        }
        return r;
    },
    undoTodo: ({ id }) => {
        let r = null;
        for (const todo of todos) {
            if (todo.id == id) {
                todo.done = false;
                r = todo;
            }
        }
        return r;
    },
    setTextTodo: ({ id, text }) => {
        let r = null;
        for (const todo of todos) {
            if (todo.id == id) {
                todo.text = text;
                r = todo;
            }
        }
        return r;
    },
};

app.use(
    '/graphql',
    graphqlHTTP({
        graphiql: true,
        schema,
        rootValue: root,
    })
);

app.listen(5000, () => console.log('Server started on port 5000'));
