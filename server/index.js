const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const sqlite3 = require('sqlite3').verbose();

const cors = require('cors');
const schema = require('./schema');

const database = new sqlite3.Database('database.db');

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

const root = {
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
                    resolve({
                        id: row['id'],
                        username: user.username,
                        age: user.age,
                        todos: [],
                    });
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
                                resolve({ ...user, ...{ todos } });
                            });
                        })
                )
            )
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
                    resolve({
                        id: row['id'],
                        text: todo.text,
                        done: todo.done ? true : false,
                        userId: todo.userId,
                    });
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

                        resolve(todo);
                    });
                })
        ),

    doTodo: ({ id }) =>
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
                    database.run('UPDATE todos SET done=? WHERE id=?;', [true, id], (err) => {
                        if (err) {
                            reject([]);
                        }

                        resolve({ ...todo, ...{ done: true } });
                    });
                })
        ),
    undoTodo: ({ id }) =>
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
                    database.run('UPDATE todos SET done=? WHERE id=?;', [false, id], (err) => {
                        if (err) {
                            reject([]);
                        }

                        resolve({ ...todo, ...{ done: false } });
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

                        resolve({ ...todo, ...{ text } });
                    });
                })
        ),
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
