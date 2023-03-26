import { createModule, gql } from 'graphql-modules';
import { UserModule } from './generated-types/module-types';
var bcrypt = require('bcryptjs');
import { prisma } from '../../../prisma/client';
import { GraphQLError } from 'graphql';

const usersResolver: UserModule.Resolvers = {
  Query: {
    // return all users
    users: async () => {
      const users = await prisma.user.findMany();
      if (!users) {
        throw new GraphQLError('No users found');
      }
      return users;
    },
    user: async (_, { id }) => {
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
      });
      if (!user) {
        throw new GraphQLError('User not found');
      }
      return user;
    },
  },

  Mutation: {
    // create a new user
    createUser: async (_, { input }) => {
      //check if user exists ( findUnique don't work in this case but count works -> return an Integer)
      const userExists = await prisma.user.count({
        OR: [{ email: input.email }, { username: input.userName }],
      });
      if (userExists) {
        throw new GraphQLError('This User already exists');
      }
      const user = await prisma.user.create({
        data: {
          email: input.email,
          username: input.userName,
          password: await bcrypt.hash(input.password, 10)
        },
      });
      return user;
    },
    loginUser: async (_, { input }) => {
      let user
      try {
        user = await prisma.user.findUnique({
          where: { email: input.email },
        });
      } catch (error) {
        throw new GraphQLError('User not found');
      }
      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        throw new GraphQLError('Invalid password');
      }
      return user;
    },
    // update a user
    updateUser: async (_, { input }) => {
      const user = await prisma.user.update({
        where: { id: Number(input.id) },
        data: {
          ...input,
        },
      });
      if (!user) {
        throw new GraphQLError('User not found');
      }
      return user;
    },
    // delete a user
    deleteUser: async (_, { id }) => {
      const exists = await prisma.user.count({
        where: { id: Number(id) },
      });
      if (!exists) {
        throw new GraphQLError('User not found');
      }
      const user = await prisma.user.delete({
        where: { id: Number(id) },
      });

      return user;
    },
  },
};

export const usersModel = createModule({
  id: 'users',
  dirname: __dirname,
  typeDefs: gql`
    input UserInput {
      userName: String
      password: String
      email: String
      id: ID
    }
    type User {
      id: ID
      userName: String
      password: String
      email: String
      role: String
      createdAt: String
    }
   
    type Query {
      users:[User]
      user(id: ID): User
    }
    type Mutation {
      createUser(input: UserInput!): User
      loginUser(input: UserInput!): User
      updateUser(input: UserInput!): User
      deleteUser(id: ID!): User
    }
  `,
  resolvers: usersResolver,
});