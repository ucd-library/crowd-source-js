const {BaseStore} = require('@ucd-lib/cork-app-utils');

class SuggestStore extends BaseStore {

  constructor() {
    super();

    this.data = {};
    this.events = {};
  }

}

module.exports = new SuggestStore();