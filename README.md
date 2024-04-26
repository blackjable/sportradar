## Submission
The following tech stack was used:
##### Tech stack
- typescriptr
- jest
- eslint
- prettier
- husky

### Design
In accordance with the brief, a TDD approach to developing the solution was taken. The solution models the following objects:

- Team
- Match
- Scoreboard
- DataStore

##### Team
Represents a named team.
##### Match
Represents a contest between two teams. This class offers the following functions:

- start match
- update store
- complete match
- update match status
- get json representation
- get human friendly match string

The class also retains the following data points:

- match score
- match status (pending/in-progress/completed)
- match players
- match id
##### Scoreboard
Represents all of the matches in progress and provides methods for the following:

- add match to scoreboard
	- this starts the match, resets score and adds match to datastore
- update match score
- complete a match
- provide ordered summay objects
- provide ordered list of human friendly match strings
##### Data store
This represents a simple im memory non-persistent data store. There are functions inserting and retrieving data items. Once an item is to be inserted an auto incrementing ID is assigned to the match.

##### Note
The auto-incrementing ID was used as it was simple to implement and provided an inherent ordering which helped when breaking a tie during summary generation.

### Major gaps
From the brief it was not always clear which error conditions would arise or what validation should be provided on method execution. As a result the general approach was to ensure non-catestrophic execution of the runtime.

### Installation

    nvm use
    npm install
    npm test
	
