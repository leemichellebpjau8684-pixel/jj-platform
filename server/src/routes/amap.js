const express = require('express');
const router = express.Router();
const https = require('https');
const url = require('url');

router.get('/geocode/geo', (req, res) => {
  const query = req.query;
  const amapUrl = `https://restapi.amap.com/v3/geocode/geo?${new URLSearchParams(query).toString()}`;
  
  const options = url.parse(amapUrl);
  options.headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };
  
  https.get(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    });
  }).on('error', (err) => {
    console.error('高德地图代理错误:', err);
    res.status(500).json({ error: '代理请求失败' });
  });
});

router.get('/place/text', (req, res) => {
  const query = req.query;
  const amapUrl = `https://restapi.amap.com/v3/place/text?${new URLSearchParams(query).toString()}`;
  
  const options = url.parse(amapUrl);
  options.headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };
  
  https.get(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    });
  }).on('error', (err) => {
    console.error('高德地图代理错误:', err);
    res.status(500).json({ error: '代理请求失败' });
  });
});

router.get('/place/around', (req, res) => {
  const query = req.query;
  const amapUrl = `https://restapi.amap.com/v3/place/around?${new URLSearchParams(query).toString()}`;
  
  const options = url.parse(amapUrl);
  options.headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };
  
  https.get(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    });
  }).on('error', (err) => {
    console.error('高德地图代理错误:', err);
    res.status(500).json({ error: '代理请求失败' });
  });
});

router.get('/geocode/regeo', (req, res) => {
  const query = req.query;
  const amapUrl = `https://restapi.amap.com/v3/geocode/regeo?${new URLSearchParams(query).toString()}`;
  
  const options = url.parse(amapUrl);
  options.headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };
  
  https.get(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    });
  }).on('error', (err) => {
    console.error('高德地图代理错误:', err);
    res.status(500).json({ error: '代理请求失败' });
  });
});

module.exports = router;