// import logo from './logo.svg';
import './App.css';
import * as mui from '@mui/material';
import React, { useEffect, useState } from 'react';
import * as animation from '../node_modules/react-animations';
import Radium, { StyleRoot } from 'radium';
import * as icon from '@mui/icons-material';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { GET_ALL_USERS } from './queries/user';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { ADD_USER, DELETE_USER } from './mutations/user';
import { SUBSCRIBE_ADDED_USER, SUBSCRIBE_DELETED_USER } from './subscriptions/user';
import { SUBSCRIBE_ADDED_TODO, SUBSCRIBE_DELETED_TODO, SUBSCRIBE_DID_UNDID_TODO, SUBSCRIBE_SET_TEXT_TODO } from './subscriptions/todo';

import { ADD_TODO, DELETE_TODO, DO_UNDO_TODO, SET_TEXT_TODO } from './mutations/todo';

const forbiddenSymbolsNumeric = ['KeyE', 'Period', 'Minus', 'Equal'];

const styles = {
    fadeIn: {
        animation: 'x 1s',
        animationName: Radium.keyframes(animation.fadeIn, 'fadeIn'),
    },
};

const App = () => {
    const [username, setUsername] = useState('');
    const [age, setAge] = useState('');
    const [users, setUsers] = useState([]);

    const { data, loading, error, refetch } = useQuery(GET_ALL_USERS);
    const [addUser] = useMutation(ADD_USER);
    const [deleteUser] = useMutation(DELETE_USER);
    const [addTodo] = useMutation(ADD_TODO);
    const [deleteTodo] = useMutation(DELETE_TODO);
    const [doUndoTodo] = useMutation(DO_UNDO_TODO);
    const [setTextTodo] = useMutation(SET_TEXT_TODO);

    const [disabled, setDisabled] = useState(false);
    const [renderUsers, setRenderUsers] = useState(false);
    const [errLoad, setErrLoad] = useState('');
    const [refreshDisabled, setRefreshDisabled] = useState(false);
    const [actionError, setActionError] = useState('');
    const [open, setOpen] = useState(false);
    const [nameInput, setNameInput] = useState(null);
    const [inputTimeout, setInputTimeout] = useState();
    const [settingText, setSettingText] = useState(false);

    useEffect(() => {
        if (!loading && users.length === 0) {
            setErrLoad('');
            setUsers(data.users);
            setRenderUsers(true);
        }
    }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (error) {
            setErrLoad(error.message);
        }
    }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

    const onAddTodo = (e, userId) => {
        e.preventDefault();
        setDisabled(true);
        addTodo({
            variables: {
                todo: {
                    text: '',
                    userId,
                },
            },
        })
            .then(({ data }) => {})
            .catch((err) => {
                setActionError(err.message);
                setOpen(true);
            })
            .finally(() => {
                setDisabled(false);
            });
    };

    const onDeleteTodo = (e, todoId) => {
        e.preventDefault();
        setDisabled(true);
        deleteTodo({
            variables: {
                id: todoId,
            },
        })
            .then(({ data }) => {})
            .catch((err) => {
                setActionError(err.message);
                setOpen(true);
            })
            .finally(() => {
                setDisabled(false);
            });
    };

    const onDoUndoTodo = (e, t) => {
        e.preventDefault();
        setDisabled(true);

        doUndoTodo({
            variables: {
                id: t.id,
                done: t.done ? false : true,
            },
        })
            .then(({ data }) => {})
            .catch((err) => {
                setActionError(err.message);
                setOpen(true);
            })
            .finally(() => {
                setDisabled(false);
            });
    };

    const onSetTextTodo = (e, t) => {
        clearTimeout(inputTimeout);
        setUsers(
            Array.from(users).map((user) => {
                const todos = Array.from(user.todos).map((todo) => {
                    if (todo.id === t.id) {
                        return { ...todo, ...{ text: e.target.value } };
                    }

                    return todo;
                });

                return { ...user, ...{ todos } };
            })
        );

        if (!settingText) {
            setInputTimeout(
                setTimeout(() => {
                    setSettingText(true);
                    setTextTodo({
                        variables: {
                            id: t.id,
                            text: e.target.value,
                        },
                    })
                        .then(({ data }) => {})
                        .catch((err) => {
                            setActionError(err.message);
                            setOpen(true);
                        })
                        .finally(() => {
                            setSettingText(false);
                            setDisabled(false);
                        });
                }, 300)
            );
        }
    };

    const onAddUser = (e) => {
        e.preventDefault();
        setDisabled(true);
        addUser({
            variables: {
                user: {
                    username,
                    age: parseInt(age),
                },
            },
        })
            .then(({ data }) => {
                setUsername('');
                setAge('');

                nameInput.focus();
            })
            .catch((err) => {
                setActionError(err.message);
                setOpen(true);
            })
            .finally(() => {
                setDisabled(false);
            });
    };

    const onDeleteUser = (e, userId) => {
        e.preventDefault();
        setDisabled(true);
        deleteUser({
            variables: {
                id: userId,
            },
        })
            .then(({ data }) => {})
            .catch((err) => {
                setActionError(err.message);
                setOpen(true);
            })
            .finally(() => {
                setDisabled(false);
            });
    };

    useSubscription(SUBSCRIBE_ADDED_USER, {
        onSubscriptionData: (data) => {
            const allUsers = Array.from(users);
            allUsers.unshift(data.subscriptionData.data.addedUser);
            setUsers(allUsers);
        },
    });

    useSubscription(SUBSCRIBE_DELETED_USER, {
        onSubscriptionData: (data) => {
            data = data.subscriptionData.data.deletedUser;
            setUsers(Array.from(users).filter((user) => user.id !== data.id));
        },
    });

    useSubscription(SUBSCRIBE_ADDED_TODO, {
        onSubscriptionData: (data) => {
            setUsers(
                Array.from(users).map((user) => {
                    if (user.id === data.subscriptionData.data.addedTodo.userId) {
                        const todos = Array.from(user.todos);
                        todos.unshift(data.subscriptionData.data.addedTodo);
                        return { ...user, ...{ todos: todos } };
                    } else {
                        return user;
                    }
                })
            );
        },
    });

    useSubscription(SUBSCRIBE_DELETED_TODO, {
        onSubscriptionData: (data) => {
            setUsers(Array.from(users).map((user) => ({ ...user, ...{ todos: Array.from(user.todos).filter((todo) => todo.id !== data.subscriptionData.data.deletedTodo.id) } })));
        },
    });

    useSubscription(SUBSCRIBE_DID_UNDID_TODO, {
        onSubscriptionData: (data) => {
            setUsers(
                Array.from(users).map((user) => {
                    const todos = Array.from(user.todos).map((todo) => {
                        if (todo.id === data.subscriptionData.data.didUndidTodo.id) {
                            return { ...todo, ...{ done: data.subscriptionData.data.didUndidTodo.done } };
                        }

                        return todo;
                    });

                    return { ...user, ...{ todos } };
                })
            );
        },
    });

    useSubscription(SUBSCRIBE_SET_TEXT_TODO, {
        onSubscriptionData: (data) => {
            setUsers(
                Array.from(users).map((user) => {
                    const todos = Array.from(user.todos).map((todo) => {
                        if (todo.id === data.subscriptionData.data.setTextTodo.id) {
                            return { ...todo, ...{ text: data.subscriptionData.data.setTextTodo.text } };
                        }

                        return todo;
                    });

                    return { ...user, ...{ todos } };
                })
            );
        },
    });

    const onChange = (e) => {
        if (e.target.name === 'age') {
            setAge(
                (() => {
                    if (e.target.value > 150) {
                        return 150;
                    } else if (e.target.value < 0) {
                        return 0;
                    } else {
                        return ((value) => {
                            const arr = value.split('');
                            for (let i = 0; i < arr.length; i++) {
                                if ((isNaN(arr[i - 1]) || arr[i - 1] === '0') && arr[i] === '0' && !isNaN(arr[i + 1])) {
                                    arr.splice(i, 1);
                                }
                            }

                            return arr.join('');
                        })(e.target.value);
                    }
                })()
            );
        } else if (e.target.name === 'username') {
            setUsername(e.target.value);
        }
    };
    const onKeyDown = (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'number' && forbiddenSymbolsNumeric.includes(e.code)) {
            e.preventDefault();
        }
    };

    const reload = (e) => {
        e.preventDefault();
        setRefreshDisabled(true);
        refetch()
            .catch((err) => {})
            .finally(() => {
                setRefreshDisabled(false);
            });
    };

    const toastClose = (e) => {
        setOpen(false);
    };

    return (
        <StyleRoot>
            <div className="d-flex justify-content-center flex-wrap align-items-center">
                {!errLoad ? (
                    <>
                        <div style={{ maxWidth: 500, minWidth: 300, width: '100%', ...styles.fadeIn }}>
                            <mui.Box
                                onSubmit={onAddUser}
                                component="form"
                                sx={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexWrap: 'wrap',
                                    '& .MuiTextField-root': { m: 1, width: '25ch' },
                                }}
                                noValidate
                                autoComplete="off"
                            >
                                <mui.TextField
                                    inputRef={(input) => {
                                        setNameInput(input);
                                    }}
                                    name="username"
                                    label="Name"
                                    variant="filled"
                                    onInput={onChange}
                                    onChange={onChange}
                                    value={username}
                                    className="form-input"
                                />
                                <mui.TextField className="form-input" name="age" onKeyDown={onKeyDown} label="Age" variant="filled" type="number" onInput={onChange} onChange={onChange} value={age} />

                                <mui.Button style={{ width: '100%', margin: 8 }} aria-label="add user" disabled={username.length === 0 || age.length === 0 || disabled} type="submit" variant="contained" endIcon={<icon.Add />}>
                                    Add
                                </mui.Button>
                                <mui.Snackbar open={open} autoHideDuration={6000} onClose={toastClose}>
                                    <mui.Alert onClose={toastClose} severity="error" sx={{ width: '100%' }}>
                                        {actionError}
                                    </mui.Alert>
                                </mui.Snackbar>
                            </mui.Box>
                        </div>
                        <div className="d-flex justify-content-center flex-wrap align-items-start" style={{ width: '100%' }}>
                            {!loading && renderUsers ? (
                                users.length > 0 ? (
                                    users.map((user) => (
                                        <div key={user.id} className="user-card" style={styles.fadeIn}>
                                            <mui.Paper elevation={4}>
                                                <mui.CardContent style={{ position: 'relative', padding: 16 }}>
                                                    <mui.IconButton
                                                        disabled={disabled}
                                                        onClick={(e) => {
                                                            onDeleteUser(e, user.id);
                                                        }}
                                                        aria-label="delete user"
                                                        color="error"
                                                        style={{ position: 'absolute', right: 0, top: 0 }}
                                                    >
                                                        <icon.Delete />
                                                    </mui.IconButton>
                                                    <mui.Typography className="d-flex align-items-end mt-4" variant="h5" component="div">
                                                        Name: {user.username}
                                                    </mui.Typography>
                                                    <mui.Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                                        age: {user.age}
                                                    </mui.Typography>

                                                    <mui.Typography sx={{ mt: 4, mb: 0 }} variant="h6" component="div">
                                                        Todos
                                                        <mui.IconButton
                                                            onClick={(e) => {
                                                                onAddTodo(e, user.id);
                                                            }}
                                                            aria-label="add todo"
                                                            disabled={disabled}
                                                            color="success"
                                                        >
                                                            <icon.Add></icon.Add>
                                                        </mui.IconButton>
                                                    </mui.Typography>
                                                    {user.todos.length > 0 ? (
                                                        <mui.List className="mb-4">
                                                            {user.todos.map((todo) => (
                                                                <mui.ListItem
                                                                    className="px-3"
                                                                    key={todo.id}
                                                                    secondaryAction={
                                                                        <>
                                                                            <mui.IconButton
                                                                                onClick={(e) => {
                                                                                    onDeleteTodo(e, todo.id);
                                                                                }}
                                                                                disabled={disabled}
                                                                                edge="end"
                                                                                aria-label="delete todo"
                                                                            >
                                                                                <icon.Delete />
                                                                            </mui.IconButton>
                                                                        </>
                                                                    }
                                                                    disablePadding
                                                                >
                                                                    <mui.ListItemIcon style={{ minWidth: 'unset' }}>
                                                                        <mui.Checkbox
                                                                            edge="start"
                                                                            disabled={disabled}
                                                                            onChange={(e) => {
                                                                                onDoUndoTodo(e, todo);
                                                                            }}
                                                                            checked={todo.done}
                                                                            tabIndex={-1}
                                                                        />
                                                                    </mui.ListItemIcon>
                                                                    <mui.TextField
                                                                        multiline
                                                                        className="todo-text"
                                                                        onChange={(e) => {
                                                                            onSetTextTodo(e, todo);
                                                                        }}
                                                                        style={{ width: 'calc(100% - 86px)' }}
                                                                        variant="standard"
                                                                        value={todo.text}
                                                                        label="todo"
                                                                    />
                                                                </mui.ListItem>
                                                            ))}
                                                        </mui.List>
                                                    ) : (
                                                        <div className="mb-5 mt-3">No todos yet</div>
                                                    )}
                                                </mui.CardContent>
                                            </mui.Paper>
                                        </div>
                                    ))
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center" style={{ width: '100%' }}>
                                        <mui.CardContent style={{ padding: 16 }}>
                                            <span>No users yet</span>
                                        </mui.CardContent>
                                    </div>
                                )
                            ) : (
                                <div className="d-flex justify-content-center align-items-center" style={{ width: '100%' }}>
                                    <mui.CardContent style={{ padding: 16 }}>
                                        <div className="spinner-border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </mui.CardContent>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <mui.Alert
                        severity="error"
                        action={
                            <mui.Button disabled={refreshDisabled} onClick={reload} color="inherit" size="small">
                                Refresh
                            </mui.Button>
                        }
                    >
                        {errLoad}
                    </mui.Alert>
                )}
            </div>
        </StyleRoot>
    );
};

export default App;
