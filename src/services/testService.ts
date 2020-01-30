
export default class TestService {

  private test;

  constructor({ url }) {
    this.test = url;
  }

  get() {
    return this.test;
  }

} 