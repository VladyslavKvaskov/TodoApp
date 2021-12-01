import { gql } from '@apollo/client';

export const SUBSCRIBE_ADDED_USER = gql`
    subscription {
        addedUser {
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

export const SUBSCRIBE_DELETED_USER = gql`
    subscription {
        deletedUser {
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
