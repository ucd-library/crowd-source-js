const firestore = require('../lib/firestore');

describe('Firestore: tear down', function() {
  describe('disconnect', async function() {
    it('should disconnect from firestore so node process can exit', async function() {
      await firestore.db.disableNetwork();
      // hack 
      setTimeout(() => process.exit(), 500);
    });
  });
});