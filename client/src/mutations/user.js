import { gql } from '@apollo/client';

export const ADD_USER = gql`
    mutation addUser($user: UserInput) {
        addUser(user: $user) {
            id
            username
            age
            todos {
                id
                text
                done
            }
        }
    }
`;

export const DELETE_USER = gql`
    mutation deleteUser($id: ID) {
        deleteUser(id: $id) {
            id
        }
    }
`;
