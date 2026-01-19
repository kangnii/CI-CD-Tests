const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json(200).json({ status: 'OK' });
});

router.get('/time', (req, res) => {
    res.json(200).json({ time: new Date().toISOString() });
});

module.exports = router;