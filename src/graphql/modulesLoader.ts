import { createApplication } from 'graphql-modules';
import { usersModel } from './modules/user/users';

export const application = createApplication({
  modules: [usersModel],
});