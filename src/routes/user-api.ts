import { route, GET, POST } from 'awilix-express' // or `awilix-router-core`

@route('/users')
export default class UserAPI {

  private testService
  constructor({ testService }) {
    this.testService = testService
  }

  @route('/:id')
  @GET()
  async getUser(req, res) {
    res.send(await this.testService.get(req.params.id))
  }

  @POST()
  async createUser(req, res) {
    res.send(await this.testService.create(req.body))
  }
}