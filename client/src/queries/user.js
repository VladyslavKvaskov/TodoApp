import { gql } from '@apollo/client';

export const GET_ALL_USERS = gql`
    query {
        users {
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
