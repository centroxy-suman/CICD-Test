const app = require('express')();
const port = 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from CI/CD!' });
});

const server = app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

// Gracefully shut down the server after the tests are done
afterAll(() => {
  server.close();
});

