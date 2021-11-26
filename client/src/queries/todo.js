import { gql } from '@apollo/client';

export const GET_ALL_TODOS = gql`
    query {
        todos {
            id
            text
            done
            userId
        }
    }
`;
