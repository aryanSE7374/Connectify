let IS_PROD = true;

const server = IS_PROD ?
    "https://connectify-9xfu.onrender.com" :
    "http://localhost:3000"

export default server;