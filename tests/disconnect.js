const firestore = require('../lib/firestore');
const data = require('./data');

describe('Tear down and cleanup', function() {

  before(function() {
    this.timeout(20000);
  });

  describe('cleanup', function() {
    it('remove test items / collections from PGR', async function() {
      await data.cleanupPgr();
    });

    it('remove test crowd inputs from Firestore', async function() {
      await data.cleanupFirestore();
    });
  });

  describe('disconnect', function() {
    it('should disconnect from firestore so node process can exit', async function() {
      await firestore.db.disableNetwork();
      // hack 
      setTimeout(() => process.exit(), 500);
    });
  });
});