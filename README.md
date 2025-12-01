# Presight Frontend Exercise

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)

### Installation
```bash
npm install
```

### Running the App
```bash
npm run start
```
This command starts both the client and server in parallel.

### Running Tests
To run tests for the client:
```bash
cd client
npm run test
```

To run tests for the server:
```bash
cd server
npm run test
```

#### Create a react application and nodes web server for the following use cases

1. Create a mock api to serve paginated list of information with filtering and search capabilities

   - Define a data object having the following
     - avatar
     - first_name
     - last_name
     - age
     - nationality
     - hobbies (list of 0 to 10 items)
   - Display the list as individual cards using virtual scroll component, subsequent pages must be loaded using infinite scroll technique (preferably using `@tanstack/react-virtual`)
   - Design the card as
     ```
     |----------------------------------|
     | avatar      first_name+last_name |
     |             nationality      age |
     |                                  |
     |             (2 hobbies) (+n)     |
     |----------------------------------|
     ```
     > display top 2 hobbies and show remaining count if applicable as _`+n`_
   - Provide a side list in page to show top 20 hobbies and nationality that can be applied as filters
   - Provide a searchbox to find and filter the data by first_name, last_name

2. Read http response as stream and create a display that will print the response one character at a time

   - Create an api that responds with long text (`faker.lorem.paragraphs(32)`)
   - Read the response as a stream, while the stream is open display the available response one character at a time
   - Once the stream is closed print entire response

3. Create an api that will process each request in webworker and respond with the result over websocket

   - The api endpoint must cache each request into an in-memory queue and respond with `pending`
   - The queued requests must be processed in a webworker, the worker should send a result over websockets (for the exercise a text result can be sent after a timeout of 2seconds)
   - In react show 20 items that correspond to 20 requests, display `pending` for each of the requests and display corresponding result on receiving the websocket result

   > request --> `pending` --> socket message --> `result`
