import { gql } from '@apollo/client';

export const SUBSCRIBE_ADDED_TODO = gql`
    subscription {
        addedTodo {
            id
            text
            done
            userId
        }
    }
`;

export const SUBSCRIBE_DELETED_TODO = gql`
    subscription {
        deletedTodo {
            id
            text
            done
            userId
        }
    }
`;

export const SUBSCRIBE_DID_UNDID_TODO = gql`
    subscription {
        didUndidTodo {
            id
            text
            done
            userId
        }
    }
`;

export const SUBSCRIBE_SET_TEXT_TODO = gql`
    subscription {
        setTextTodo {
            id
            text
            done
            userId
        }
    }
`;
