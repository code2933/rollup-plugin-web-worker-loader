const kDefaultsOptions = {
    inline: true,
    preserveSource: false,
    enableUnicode: false,
    targetPlatform: 'browser',
    browserWorker: 'Worker'
};

function getWorkerName(options) {
    if (options.targetPlatform === 'browser') {
        return options.browserWorker
    }
    return 'Worker'
}

function getFactoryFuncName(options) {
    const workerName = getWorkerName(options)
    if (options.inline) {
        if (options.preserveSource) {
            return `createInline${workerName}Factory`;
        }
        return `createBase64${workerName}Factory`;
    }
    return `createURL${workerName}Factory`;
}

function getArgsString(source, sourcemap, options) {
    if (options.targetPlatform === 'base64') {
        return Buffer.from(source, options.enableUnicode ? 'utf16le' : 'utf8').toString('base64');
    }

    if (options.inline) {
        const sourcemapArg = sourcemap ? `'${sourcemap.toUrl()}'` : 'null';
        if (options.preserveSource) {
            return `${source.substring(0, source.length - 1)}, ${sourcemapArg}`;
        }
        const sourceArg = Buffer.from(source, options.enableUnicode ? 'utf16le' : 'utf8').toString('base64');
        return `'${sourceArg}', ${sourcemapArg}, ${options.enableUnicode.toString()}`;
    }
    return `'${source}'`;
}

function buildWorkerSource(options, factoryFuncName, argsString) {
    if (options.targetPlatform === 'base64') {
        return `
/* eslint-disable */
var base64 = '${argsString}';
export default base64;
/* eslint-enable */\n`;
    }

    return `
/* eslint-disable */
import {${factoryFuncName}} from '\0rollup-plugin-web-worker-loader::helper::${options.targetPlatform}::${factoryFuncName}';
var WorkerFactory = /*#__PURE__*/${factoryFuncName}(${argsString});
export default WorkerFactory;
/* eslint-enable */\n`;
}

function buildWorkerCode(source, sourcemap = null, optionsArg = kDefaultsOptions) {
    const options = Object.assign({}, kDefaultsOptions, optionsArg);
    const factoryFuncName = getFactoryFuncName(options);
    const argsString = getArgsString(source, sourcemap, options);
    return buildWorkerSource(options, factoryFuncName, argsString);
}

module.exports = buildWorkerCode;
