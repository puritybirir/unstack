require("babel-register")({
  presets: ['env', 'react'],
  plugins: ['transform-object-rest-spread', 'transform-runtime']
});

const { hashElement } = require('folder-hash');

const handleServiceWithContext = require('../utils/handleServiceWithContext');
const contextStore = require('./contextStore');
const cacheStore = require('./cacheStore');

const serviceFolderIsSame = async (serviceName) => {
  const cache = cacheStore.read();
  const existingServiceHash = cache.serviceHashes[serviceName];
  const hash = await hashElement(`./${serviceName.split('.').join('/')}`, {})
  const newServiceHash = hash.hash;
  cache.serviceHashes = { ...cache.serviceHashes, [serviceName]: newServiceHash };
  cacheStore.write(cache);
  return newServiceHash == existingServiceHash;
}

process.on('message', async ({ name, info, fullRebuild }) => {
  const context = contextStore.read()

  const shouldRebuild = !(await serviceFolderIsSame(name));

  if (fullRebuild || shouldRebuild) {
    const newContext = await handleServiceWithContext(context)(info, shouldRebuild);
    contextStore.write(newContext);
  }

  process.send({command: 'done'});
});