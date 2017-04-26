'use strict';

const webpack = require('webpack');
const Constant = require('./constant');
const MFS = require('memory-fs');
const Utils = require('../build/lib/utils');

module.exports = agent => {

  const projectDir = agent.baseDir;
  const buildConfig = agent.config.vuewebpackdev;
  const env = process.env.EGG_SERVER_ENV || 'dev';
  const serverWebpackConfig = require(`../build/webpack.server.${env}.conf`)(projectDir, buildConfig);
  const compiler = webpack([ serverWebpackConfig ]);

  compiler.outputFileSystem = new MFS();

  compiler.plugin('done', () => {
    agent.messenger.sendToApp(Constant.EVENT_WEBPACK_SERVER_BUILD_STATE, { state: true });
    agent.webpack_server_build_success = true;
  });

  compiler.watch({}, (err, stats) => {
    if (err) throw err;
    process.stdout.write('Server bundle compiled:\n' + stats.toString('normal') + '\n');
  });

  agent.messenger.on(Constant.EVENT_WEBPACK_SERVER_BUILD_STATE, () => {
    agent.messenger.sendToApp(Constant.EVENT_WEBPACK_SERVER_BUILD_STATE, { state: agent.webpack_server_build_success });
  });

  agent.messenger.on(Constant.EVENT_WEBPACK_READ_SERVER_FILE_MEMORY, data => {
    const fileContent = Utils.readWebpackMemoryFile(compiler, data.filePath);
    if (fileContent) {
      agent.messenger.sendToApp(Constant.EVENT_WEBPACK_READ_SERVER_FILE_MEMORY_CONTENT, {
        fileContent
      });
    } else {
      agent.logger.error(`webpack server memory file[${data.filePath}] not exist!`);
      agent.messenger.sendToApp(Constant.EVENT_WEBPACK_READ_SERVER_FILE_MEMORY_CONTENT, {
        fileContent: ''
      });
    }
  });
};
