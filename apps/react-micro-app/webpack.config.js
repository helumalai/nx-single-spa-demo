const webpackMerge = require('webpack-merge');
const singleSpaDefaults = require('webpack-config-single-spa-react');

module.exports = webpackConfigEnv => {
  const defaultConfig = singleSpaDefaults({
    orgName: 'test',
    projectName: 'react-micro-app',
    webpackConfigEnv,
  })

  return webpackMerge.smart(defaultConfig, {
    // modify the webpack config however you'd like to by adding to this object
    entry: {
      "main":"./apps/react-spa/src/test-react-micro-app.js"
    },
    output: {
      filename: './apps/react-spa/test-react-micro-app.js',
    },
    mode: 'development'
  })
}
