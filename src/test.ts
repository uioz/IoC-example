import { createContainer, asClass } from "awilix";


class ScopedService {
  constructor() {
    console.log('ScopedService created!');
  }
}

class SingletonService {
  constructor() {
    console.log('SingletonService created');
  }
}

const container = createContainer();


container.register({
  ScopedService: asClass(ScopedService).scoped(),
  SingletonService:asClass(SingletonService).singleton()
})



const scopedContainer = container.createScope();

scopedContainer.resolve('ScopedService')
scopedContainer.resolve('SingletonService')

container.resolve('ScopedService')
container.resolve('SingletonService')