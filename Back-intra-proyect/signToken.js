const jwt = require('jsonwebtoken')
const { config } = require("./config/config.js");

const secret = config.api_key;
