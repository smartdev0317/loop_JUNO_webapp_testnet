const isMainnet = true;
const config_testnet = {
    url: "https://bombay-lcd.terra.dev",
    terraswapRouterAddress: "terra14z80rwpd0alzj4xdtgqdmcqt9wd9xj5ffd60wp",
    astroportRouterAddress: "terra13wf295fj9u209nknz2cgqmmna7ry3d3j5kv7t4",
    dexloopFactoryAddress: null,
    terraswapFactoryAddress: "terra18qpjm4zkvqnpjpw0zn0tdr8gdzvt8au35v45xf",
    astroportFactoryAddress: "terra15jsahkaf9p0qu8ye873p0u5z6g07wdad0tdq43",
    tokens: "/testnet-tokens.json",
}

const config_mainnet = {
    url: "https://lcd.terra.dev/",
    junoRouterAddress: "", // TODO UPDATE
    junoFactoryAddress: "", // TODO UPDATE
    dexloopFactoryAddress: "juno1zx4m56c7vfcysa4fxng43tpfe4uvhte2vrccr2884hj3eame7d6q5fvrdt", // TODO UPDATE
    // dexloopFactoryAddress2: "terra10fp5e9m5avthm76z2ujgje2atw6nc87pwdwtww", // TODO UPDATE
    tokens: "./mainnet-tokens.json",
    poolList: "./poolList.json",
}

const config = (isMainnet) ? config_mainnet : config_testnet;

export {
    config
};