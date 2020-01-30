import * as express from 'express';
import { createContainer, Lifetime, asValue } from 'awilix';
import { loadControllers, scopePerRequest } from 'awilix-express';

const app = express()

const container = createContainer();

container.loadModules(
  [
    [__dirname + '/services/**/*.js', {
      lifetime: Lifetime.SCOPED
    }]
  ]
);

app.use(scopePerRequest(container));


app.use((request, response, next) => {

  request.container.register({
    url: asValue(request.url)
  });

  return next();

});

app.use(loadControllers(__dirname + '/routes/**/*.js'));

app.listen(3000, () => {
  console.log("server running in 3000 port")
})