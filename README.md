# crowd-source-js
JS library for interacting with UCD library crowd source databases.  Including crowd-source-db (PGR/Postgres), Firestore and UCD FIN/DAMS

# Overview

![crowd-source-js overview](./docs/crowd-source-js-overview.png)

# Method Overview

## Crowd Inputs
- get approved by item (PGR)
  - gets all approved inputs for item
  - will trigger update events for individual inputs and item
- get approved by id (PGR)
- set approved (PGR/Firestore)
  - add input to pgr, remove from firestore
- add pending (Firestore)
  - add pending input to firestore
- remove pending (Firestore)
  - remove a pending crowd input.  
  - Must be admin or owned by user
- update pending (Firestore)
  - update a pending crowd input.  
  - Must be admin or owned by user
- get pending (Firestore)
- get pending by item (Firestore)
  - get all pending inputs for item
  - will trigger update events for individual inputs and item
- listen pending by item (Firestore)
  - get pushed updates of all inputs for item
  - will trigger update events for individual inputs and item
  - if input is deleted, will check if it was approved.  Fires approved update event if it was 
- unlisten pending by item (Firestores)
  - stop listing to push update of inputs for item

## Items
- get by id (ElasticSearch)
- search (ElasticSearch)
  - supports text, filters, limit, offsets, etc
- get crowd info (PGR)
  - get crowd information for item, ex: editable, completed
- update crowd info (PGR)
  - update the crowd information for item (admin only)
- get crowd child stats (PGR)
  - given a item id, get summary of crowd info for all child items

## Presence

- set user id
  - set the user id to be automatically associated with all presence objects
- update presence
  - add or update a new presence object.  Will automatically add userId, uid
    and appId to object.  Used to listen for realtime updates while they are 
    happening.
- remove presence
  - remove a presence object

*Note: the PresenceService will list to firebase authentication events and remove presence on logout.  The service will also set handlers so on disconnect, presence objects are removed.

## Auth

- userLogin
  - Given a user firebase jwt  token and PGR jwt token, store tokens and run firebase login function.
- anonymousLogin
  - Use the Google Cloud Function service to generate anonymous user firebase and pgr tokens.  Then login user to firebase with token and finally store tokens

## Auth0

Auth0 is an optional extension for including Auth0 as a authentication and authorization source.  Note the Auth model just requires JWTs signed with applications Firebase and PGR accounts.  This model provides support for; logging in via Auth0 Lock UI, running Auth0 Lock authentication flow, generating Firebase and PGR JWTs from Auth0 JWT.  The generated JWTs are then passed to the AuthModel userLogin() function.

Note.  Perhaps this should be broken out to it's own JS library?

- login
  - Show the Auth0 Lock widget starting the login flow
- isRedirect
  - is the current hash in the windows url a redirect from Auth0?  If so, continue the login flow
- loginJwt
  - Continue Auth0 login flow after new JWT is issued.  Given a Auth0 JWT, use the Google Cloud Function service to generate Firebase and PGR JWTs from Auth0 JWT.  Roles provided in Auth0 JWT will be automatically associated to Firebase/PGR JWTs.
- initAuthRenewAuth0/autoRenew
  - both of these functions should be called by isRedirect(true).  The true flag will initiate a silent login flow for user if the url hash is not in the middle of a Auth0 login.  Silent logins will take a access token that is about to expire and generate a new one.

# Authentication

## crowd-source-db (PostgREST/PostreSQL)

PostgREST authenticates via a Bearer JWT token in the Authorization header.  Methods that require authentication (currently the CrowdSourceModel.setApproved() ) require the JWT when called.  The JWT should have the following payload:

```js
{
  username : '',
  role : ''
}
```

Where role is empty or 'admin'.  JWTs can be minted for PGR using the jsonwebtoken library.

```js
const jwt = require('jsonwebtoken');
let token = jwt.sign({username, role}, 'secret');
```

## Firestore

Firebase has several authentication methods but the JWT token method is recommended.  The payload for the token should include the email and isAdmin flag.

```js
{
  email : '', 
  isAdmin : false
}
```

You should use the firebase-admin library with a Google/Firebase Service Account to mint the tokens.  Once firebase is authenticated with the token, no further action is required.

```js
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

(async function() {
  admin.initializeApp({
    credential : admin.credential.cert(serviceAccount)
  });

  let token = await admin.auth().createCustomToken(
    userId,
    {email, isAdmin}
  );
})();
```

## FIN / DAMS

The DAMS Elastic Search API is public and does not require authentication.

# Auth0

Here is the standard authentication flow with Auth0

![crowd-source-js auth flow](./docs/crowd-source-js-auth-flow.png)