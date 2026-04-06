require('dotenv').config();
const express = require('express');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/users', require('./Routes/users'));
app.use('/api/tasks', require('./Routes/tasks'));
app.use('/api/habits', require('./Routes/habit'));

app.get('/', (req, res) => {
  res.json({ message: 'Strata API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});