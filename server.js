const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err.message);
  } else {
    console.log('Connected to PostgreSQL database.');
    // Create votes table if it doesn't exist
    pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        voter_details JSONB,
        votes JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating votes table:', err.message);
      } else {
        console.log('Votes table created or already exists.');
      }
    });
  }
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

app.post('/submit-vote', async (req, res) => {
  const { voterDetails, votes } = req.body;
  const { staffId } = voterDetails;
  const voterDetailsString = JSON.stringify(voterDetails);
  const votesString = JSON.stringify(votes);

  try {
    const check = await pool.query('SELECT 1 FROM votes WHERE voter_details->>\'staffId\' = $1', [staffId]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Duplicate vote detected: Staff ID already voted' });
    }

    const result = await pool.query(
      `INSERT INTO votes (voter_details, votes) VALUES ($1, $2) RETURNING id`,
      [voterDetailsString, votesString]
    );
    console.log(`Vote saved with ID: ${result.rows[0].id}`);
    res.json({ success: true, message: 'Vote submitted successfully' });
  } catch (error) {
    console.error('Error inserting vote:', error.message);
    res.status(500).json({ error: 'Failed to save vote' });
  }
});

app.get('/results', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM votes');
    res.json(result.rows);
  } catch (error) {
    console.error('Error retrieving votes:', error.message);
    res.status(500).json({ error: 'Failed to retrieve votes' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});