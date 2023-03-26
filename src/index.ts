
import { createServer } from "http";
import express from "express";
import { ApolloServer} from "@apollo/server";
import gql from 'graphql-tag';
import http from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { json } from "body-parser";
import { prisma } from './prisma/client';
import { application } from './graphql/modulesLoader';


const startServer = async () => {

  const app = express()
  const httpServer = createServer(app)

  const schema = application.createSchemaForApollo();

  const typeDefs = gql`
    type User {
      id: ID!
      email: String!  
      name: String
      posts: [String!]!
    }
    type Query {
      user: [User!]!
    }
    type Query {
      hello: String!
    }
  `;

  const resolvers = {
    Query: {
      hello: () => 'Hello world!',
      user: () =>{
        return prisma.user.findMany()
      } 
    },
  };

  const apolloServer = new ApolloServer({
    schema
  })

  await apolloServer.start()

  app.use(
    '/api',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({ token: req.headers.token }),
    }),
  );
  
  await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000/graphql`);
}

startServer()