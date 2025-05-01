const express = require('express');
     const sqlite3 = require('sqlite3').verbose();
     const app = express();
     const port = process.env.PORT || 3000;

     app.use(express.json());

     const db = new sqlite3.Database('votes.db', (err) => {
       if (err) {
         console.error('Error opening database:', err.message);
       } else {
         console.log('Connected to SQLite database.');
         db.run(`
           CREATE TABLE IF NOT EXISTS votes (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             voterDetails TEXT,
             votes TEXT,
             timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
           )
         `);
       }
     });

     app.use((req, res, next) => {
       res.header('Access-Control-Allow-Origin', '*');
       res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
       res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
       next();
     });

     app.post('/submit-vote', (req, res) => {
       const { voterDetails, votes } = req.body;
       const voterDetailsString = JSON.stringify(voterDetails);
       const votesString = JSON.stringify(votes);

       db.run(
         `INSERT INTO votes (voterDetails, votes) VALUES (?, ?)`,
         [voterDetailsString, votesString],
         function (err) {
           if (err) {
             console.error('Error inserting vote:', err.message);
             res.status(500).json({ error: 'Failed to save vote' });
           } else {
             console.log(`Vote saved with ID: ${this.lastID}`);
             res.json({ success: true, message: 'Vote submitted successfully' });
           }
         }
       );
     });

     app.get('/results', (req, res) => {
       db.all(`SELECT * FROM votes`, [], (err, rows) => {
         if (err) {
           console.error('Error retrieving votes:', err.message);
           res.status(500).json({ error: 'Failed to retrieve votes' });
         } else {
           res.json(rows);
         }
       });
     });

     app.listen(port, () => {
       console.log(`Server running on port ${port}`);
     }); 
