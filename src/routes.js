const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

router.get('/time', (req, res) => {
    res.json({ time: new Date().toISOString() });
});

router.get('/welcome', (req, res) => {
const name = req.query.name || 'Visiteur'
// VULNÉRABILITÉ : On renvoie l'input utilisateur sans filtrage
res.send(`<h1>Bienvenue, ${name}</h1>`)
});

module.exports = router;