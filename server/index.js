const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const sqlite3 = require('sqlite3').verbose();
const { PubSub } = require('graphql-subscriptions');
const cors = require('cors');
const schema = require('./schema');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { createServer } = require('http');

const database = new sqlite3.Database('database.db');

const pubsub = new PubSub();
const ADDED_USER = 'ADDED_USER';
const DELETED_USER = 'DELETED_USER';
const ADDED_TODO = 'ADDED_TODO';
const DELETED_TODO = 'DELETED_TODO';
const DID_UNDID_TODO = 'DID_UNDID_TODO';
const SET_TEXT_TODO = 'SET_TEXT_TODO';

database.run(`
    CREATE TABLE IF NOT EXISTS users (
    id integer PRIMARY KEY,
    username text,
    age integer )
`);
database.run(`
    CREATE TABLE IF NOT EXISTS todos (
    id integer PRIMARY KEY,
    text text,
    done bolean,
    userId integer )
`);

const app = express();
app.use(cors());

const wsResolvers = {
    addedUser: () => pubsub.asyncIterator(ADDED_USER),
    deletedUser: () => pubsub.asyncIterator(DELETED_USER),
    addedTodo: () => pubsub.asyncIterator(ADDED_TODO),
    deletedTodo: () => pubsub.asyncIterator(DELETED_TODO),
    didUndidTodo: () => pubsub.asyncIterator(DID_UNDID_TODO),
    setTextTodo: () => pubsub.asyncIterator(SET_TEXT_TODO),
};

const httpResolvers = {
    users: () =>
        new Promise((resolve, reject) => {
            database.all('SELECT * FROM users ORDER BY id DESC;', (err, rowsUser) => {
                if (err) {
                    reject([]);
                }

                resolve(rowsUser);
            });
        }).then(
            (rowsUser) =>
                new Promise((resolve, reject) => {
                    database.all('SELECT * FROM todos ORDER BY id DESC;', (err, rowsTodo) => {
                        if (err) {
                            reject([]);
                        }

                        const r = [];
                        for (const user of rowsUser) {
                            r.push({
                                ...user,
                                ...{
                                    todos: rowsTodo.filter((todo) => todo.userId == user.id),
                                },
                            });
                        }

                        resolve(r);
                    });
                })
        ),

    user: ({ id }) =>
        new Promise((resolve, reject) => {
            database.get('SELECT * FROM users WHERE id=?;', [id], (err, user) => {
                if (err) {
                    reject([]);
                }

                resolve(user);
            });
        }).then(
            (user) =>
                new Promise((resolve, reject) => {
                    database.all('SELECT * FROM todos WHERE userId = ?;', [id], (err, todos) => {
                        if (err) {
                            reject([]);
                        }

                        resolve({ ...user, ...{ todos } });
                    });
                })
        ),

    todos: () =>
        new Promise((resolve, reject) => {
            database.all('SELECT * FROM todos;', (err, todos) => {
                if (err) {
                    reject([]);
                }

                resolve(todos);
            });
        }),

    todo: ({ id }) =>
        new Promise((resolve, reject) => {
            database.get('SELECT * FROM todos WHERE id=?;', [id], (err, todo) => {
                if (err) {
                    reject([]);
                }

                resolve(todo);
            });
        }),

    addUser: ({ user }) =>
        new Promise((resolve, reject) => {
            database.run('INSERT INTO users (username, age) VALUES (?,?);', [user.username, user.age], (err) => {
                if (err) {
                    reject([]);
                }
                database.get('SELECT last_insert_rowid() as id;', (err, row) => {
                    if (err) {
                        reject([]);
                    }

                    const addedUser = {
                        id: row['id'],
                        username: user.username,
                        age: user.age,
                        todos: [],
                    };

                    pubsub.publish(ADDED_USER, {
                        addedUser,
                    });

                    resolve(addedUser);
                });
            });
        }),

    deleteUser: ({ id }) =>
        new Promise((resolve, reject) => {
            database.get('SELECT * FROM users WHERE id=?;', [id], (err, user) => {
                if (err) {
                    reject([]);
                }

                resolve(user);
            });
        }).then((user) =>
            new Promise((resolve, reject) => {
                database.run('DELETE FROM users WHERE id=?;', [id], (err) => {
                    if (err) {
                        reject([]);
                    }
                    resolve(user);
                });
            }).then(() =>
                new Promise((resolve, reject) => {
                    database.all('SELECT * FROM todos WHERE userId=?;', [id], (err, todos) => {
                        if (err) {
                            reject([]);
                        }
                        resolve(todos);
                    });
                }).then(
                    (todos) =>
                        new Promise((resolve, reject) => {
                            database.run('DELETE FROM todos WHERE userId=?;', [id], (err) => {
                                if (err) {
                                    reject([]);
                                }

                                const deletedUser = { ...user, ...{ todos } };

                                pubsub.publish(DELETED_USER, {
                                    deletedUser,
                                });

                                resolve(deletedUser);
                            });
                        })
                )
            )
        ),
    addTodo: ({ todo }) =>
        new Promise((resolve, reject) => {
            database.run('INSERT INTO todos (text, done, userId) VALUES (?,?,?);', [todo.text, todo.done ? true : false, todo.userId], (err) => {
                if (err) {
                    reject([]);
                }
                database.get('SELECT last_insert_rowid() as id', (err, row) => {
                    if (err) {
                        reject([]);
                    }

                    const addedTodo = {
                        id: row['id'],
                        text: todo.text,
                        done: todo.done ? true : false,
                        userId: todo.userId,
                    };

                    pubsub.publish(ADDED_TODO, {
                        addedTodo,
                    });

                    resolve(addedTodo);
                });
            });
        }),

    deleteTodo: ({ id }) =>
        new Promise((resolve, reject) => {
            database.get('SELECT * FROM todos WHERE id=?;', [id], (err, todo) => {
                if (err) {
                    reject([]);
                }

                resolve(todo);
            });
        }).then(
            (todo) =>
                new Promise((resolve, reject) => {
                    database.run('DELETE FROM todos WHERE id=?;', [id], (err) => {
                        if (err) {
                            reject([]);
                        }

                        pubsub.publish(DELETED_TODO, {
                            deletedTodo: todo,
                        });

                        resolve(todo);
                    });
                })
        ),

    doUndoTodo: ({ id, done }) =>
        new Promise((resolve, reject) => {
            database.get('SELECT * FROM todos WHERE id=?;', [id], (err, todo) => {
                if (err) {
                    reject([]);
                }

                resolve(todo);
            });
        }).then(
            (todo) =>
                new Promise((resolve, reject) => {
                    database.run('UPDATE todos SET done=? WHERE id=?;', [done, id], (err) => {
                        if (err) {
                            reject([]);
                        }

                        const didUndidTodo = { ...todo, ...{ done: done } };

                        pubsub.publish(DID_UNDID_TODO, {
                            didUndidTodo,
                        });

                        resolve(didUndidTodo);
                    });
                })
        ),

    setTextTodo: ({ id, text }) =>
        new Promise((resolve, reject) => {
            database.get('SELECT * FROM todos WHERE id=?;', [id], (err, todo) => {
                if (err) {
                    reject([]);
                }

                resolve(todo);
            });
        }).then(
            (todo) =>
                new Promise((resolve, reject) => {
                    database.run('UPDATE todos SET text=? WHERE id=?;', [text, id], (err) => {
                        if (err) {
                            reject([]);
                        }

                        const setTextTodo = { ...todo, ...{ text } };

                        pubsub.publish(SET_TEXT_TODO, {
                            setTextTodo,
                        });

                        resolve(setTextTodo);
                    });
                })
        ),
};

app.use(
    '/graphql',
    graphqlHTTP({
        graphiql: true,
        schema,
        rootValue: httpResolvers,
    })
);

const server = createServer(app);

server.listen(5000, () => {
    new SubscriptionServer(
        {
            execute,
            subscribe,
            schema,
            rootValue: wsResolvers,
        },
        {
            server,
            path: '/subscriptions',
        }
    );
    console.log('Server started on port 5000');
});
