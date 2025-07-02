const path = require('path');

module.exports = {
  entry: './matrix-init.js',
  output: {
    filename: 'matrix-bundle.js',
    path: path.resolve(__dirname, 'js'),
  },
  mode: 'production', // <- Change to 'production' for final deploy
   resolve: {
      alias:  {
        'matrix-js-sdk/lib/rust-crypto': false
      },
        
      fallback: {
        'fs': false,
        'path': false,
        'crypto': false,
        'stream': false,
        'zlib': false,
        'buffer': false,
      },
    alias: {
      'matrix-js-sdk/lib/rust-crypto': false,
    },
  },
  cache: {
    type: 'filesystem',
  },
};

