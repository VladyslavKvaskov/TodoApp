import { gql } from '@apollo/client';

export const ADD_TODO = gql`
    mutation addTodo($todo: TodoInput) {
        addTodo(todo: $todo) {
            id
            text
            done
            userId
        }
    }
`;

export const DELETE_TODO = gql`
    mutation deleteTodo($id: ID) {
        deleteTodo(id: $id) {
            id
        }
    }
`;

export const DO_UNDO_TODO = gql`
    mutation doUndoTodo($id: ID, $done: Boolean) {
        doUndoTodo(id: $id, done: $done) {
            id
            done
        }
    }
`;

export const SET_TEXT_TODO = gql`
    mutation setTextTodo($id: ID, $text: String) {
        setTextTodo(id: $id, text: $text) {
            id
        }
    }
`;
