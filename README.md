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
- get crowd child stats (PGR)
  - given a item id, get summary of crowd info for all child items