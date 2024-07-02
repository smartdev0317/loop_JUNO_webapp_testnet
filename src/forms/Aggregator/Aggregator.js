import axios from 'axios';
import {
    computeD,
    computeY
} from '@saberhq/stableswap-sdk';
import {
    default as JSBI
} from "jsbi";
import {
    config
} from './config';
import poolList from './poolList.json';
import tokens from './mainnet-tokens.json';
import {
    useEffect,
    useState
} from "react";

const routers = [{
        name: "juno",
        index: 0,
        // address: config.terraswapRouterAddress,
        // factoryAddress: config.terraswapFactoryAddress,
        poolList: poolList.juno,
    },
    {
        name: "loop",
        index: 1,
        // address: config.astroportRouterAddress,
        factoryAddress: config.dexloopFactoryAddress,
        poolList: poolList.loop
    // },
    // {
    //     name: "dex",
    //     index: 2,
    //     // factoryAddress: config.dexloopFactoryAddress,
    //     poolList: poolList.dex
    },
    {
    name: "wynd",
    index: 2,
    // address: config.terraswapRouterAddress,
    // factoryAddress: config.terraswapFactoryAddress,
    poolList: poolList.wynd,
    },
]

var commonTokens = [
    "ujuno",
    "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup", // LOOP
    "ibc/C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9", // ATOM
    "juno15u3dt79t6sxxa3x3kpkhzsy56edaa5a66wvt3kxmukqjz2sx0hes5sn38g", // RAW
    "ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034", // USDC
    "juno1hnftys64ectjfynm6qjk9my8jd3f6l9dq9utcd3dy8ehwrsx9q4q7n9uxt" //AQUA
];

// returns the pool contract address for a given DEX that contains both token addresses
function pairContractAddress(addressFrom, addressTo, index) {
    let pool = getPool(addressFrom, addressTo, index);
    if (pool.length === 1) {
        return pool[0].swap_address;
    } else {
        return false;
    }
}

// returns the pool for a given DEX that contains both token addresses
function getPool(addressFrom, addressTo, index) {
    return routers[index].poolList.filter(item =>
        JSON.stringify(item.pool_assets).includes(JSON.stringify(addressFrom)) &&
        JSON.stringify(item.pool_assets).includes(JSON.stringify(addressTo)));
}

// returns all tokens addresses with shared pool with token on specific dex
function getNextAddress(address, index) {
    let pools = routers[index].poolList.filter(item =>
        JSON.stringify(item.pool_assets).includes(JSON.stringify(address)));
    let poolsPairAddresses = pools.map(item => getPoolPairAddresses(item));
    for (let i = 0; i < poolsPairAddresses.length; i++) {
        let indexToken = poolsPairAddresses[i].indexOf(address);
        poolsPairAddresses[i].splice(indexToken, 1);
    }
    let intermediatei = poolsPairAddresses.map(item => item[0]);
    return intermediatei;
}

// returns tokens addresses of a pool
function getPoolPairAddresses(pool) {
    let address1 = pool.pool_assets[0].native ?
        pool.pool_assets[0].denom :
        pool.pool_assets[0].token_address;
    let address2 = pool.pool_assets[1].native ?
        pool.pool_assets[1].denom :
        pool.pool_assets[1].token_address;
    return [address1, address2];
}

//get token by address
function getTokenByAddress(address) {
    return tokens.filter(item => item.tokenAddress === address)[0];
}

var poolDataList = [];
var localDb = false;

async function poolDataLocal(poolAddress, _isStable, refetch = false) { // retrives pool data from API and stores in variable for later use
    if (JSON.stringify(poolDataList).includes(poolAddress) && !refetch) { // check if pool is already in variable
        let _poolData = JSON.parse(JSON.stringify(poolDataList.filter(item => item.poolAddress === poolAddress)));
        return [_poolData[0].poolData, _poolData[0].amp];
    } else { // if not, get it from API
        try {
            let amp = 0;

            let apiURL;
            if (localDb) {
                apiURL = 'http://localhost:8001/getPoolByAddress?address=' + poolAddress;
            } else {
                apiURL = 'https://testbombay.loop.onl/aggregator/getPoolByAddress?address=' + poolAddress;
            }

            let _poolData = undefined
            let index = 0;
            while ((_poolData === undefined || Object.keys(_poolData).length <= 0) && index < 3){
                _poolData = await (await axios.get(apiURL)).data.poolData;
                index = index+1;
            }

            if (JSON.stringify(routers[1].poolList).includes(poolAddress) || (routers.length > 2 ? JSON.stringify(routers[2].poolList).includes(poolAddress) : false)) {
                let tempPoolData = JSON.parse(JSON.stringify(_poolData));
                _poolData = {
                    "token1_denom": tempPoolData.assets[0].info,
                    "token1_reserve": tempPoolData.assets[0].amount,
                    "token2_denom": tempPoolData.assets[1].info,
                    "token2_reserve": tempPoolData.assets[1].amount,
                }
            }

            poolDataList = poolDataList.concat({
                "poolAddress": poolAddress,
                "poolData": _poolData,
                "amp": amp
            });

            return [_poolData, amp];
        } catch (e) {
            console.log('error poolData', poolAddress, e);
        }
    }
}

var isReverse = false;

export const Aggregator = (addressFrom, addressTo, fval, n, _isReverse) => {
    const [someData, setSomeData] = useState({});

    const fetchRSD = async () => {
        try {
            let data = await routingSplittingDexs(addressFrom, addressTo, fval, n, _isReverse);
            setSomeData(data);
            // console.log('data XXX', data);
        } catch (e) {
            console.log('error Aggregator.js fetchRSD:', e);
        }
    }

    useEffect(() => {
        if (fval > 0 && addressFrom !== addressTo) {
            setSomeData({ load: null, simulated: { amount: 0, spread: 0, commision: 0, price: 0 }, error: false, loading: true, route: null });
            const timeOutId = setTimeout(() => fetchRSD(), 1000);
            return () => clearTimeout(timeOutId);
        } else {
            setSomeData({ load: null, simulated: { amount: 0, spread: 0, commision: 0, price: 0 }, error: false, loading: false, route: null });
        }
    }, [addressFrom, addressTo, fval, n, _isReverse]);

    return someData;
}

export const useAggregator = (addressFrom, addressTo, fval, n, _isReverse) => {
    const [someData, setSomeData] = useState({});

    const fetchRSD = async () => {
        try {
            let data = await routingSplittingDexs(addressFrom, addressTo, fval, n, _isReverse);
            setSomeData(data);
            // console.log('data XXX', data);
        } catch (e) {
            console.log('error Aggregator.js fetchRSD:', e);
        }
    }

    useEffect(() => {
        if (fval > 0 && addressFrom !== addressTo) {
            setSomeData({ load: null, simulated: { amount: 0, spread: 0, commision: 0, price: 0 }, error: false, loading: true, route: null });
            const timeOutId = setTimeout(() => fetchRSD(), 1000);
            return () => clearTimeout(timeOutId);
        } else {
            setSomeData({ load: null, simulated: { amount: 0, spread: 0, commision: 0, price: 0 }, error: false, loading: false, route: null });
        }
    }, [addressFrom, addressTo, fval, n, _isReverse]);

    return someData;
}

/* ------------ Routing and Splitting between all DEXs ------------
 *  Inputs:
 *    addressFrom - Offer token address
 *    addressTo - Ask token address
 *    fval - Offer amount of Offer token
 *    n - number of splits
 *  Outputs:
 *    poolsTotal - Array of objects (each unique path) with path's price, portion of total and paths
 */
async function routingSplittingDexs(addressFrom, addressTo, fval, n, _isReverse) {
    // console.log('routingSplittingDexs', addressFrom, addressTo, fval, n, _isReverse);
    let steps = [];
    let poolsUpdateValues = [];
    let price = 0;
    let total_spread = 0;
    let total_comission = 0;
    isReverse = _isReverse;

    let error = false;
    let loading = true;

    for (let i = 0; i < n; i++) {
        steps[i] = isReverse ?
            await routeStepCommonReverse(addressFrom, addressTo, fval / n, poolsUpdateValues) :
            await routeStepCommon(addressFrom, addressTo, fval / n, poolsUpdateValues); // gets best path for current step

        price += steps[i].price;
        let step_spread_multiplier = 1;

        for (let j = 0; j < steps[i].steps; j++) { // updates pools balances for further steps calculations
            let pathName = "path" + (j + 1);
            let poolAddress = pairContractAddress(steps[i][pathName].from, steps[i][pathName].to, steps[i][pathName].dex);
            let amount0;
            let amount1;

            let [_poolData, ] = await poolDataLocal(poolAddress, false);
            if (JSON.stringify(_poolData.token1_denom).includes(steps[i][pathName].from)) { // adds last step's offer amount to pool balance and removes ask amount from pool balance
                isReverse ? amount0 = +steps[i][pathName].price : amount0 = +steps[i][pathName].startPrice;
                amount1 = +(-steps[i][pathName].swap);
            } else {
                isReverse ? amount1 = +steps[i][pathName].price : amount1 = +steps[i][pathName].startPrice;
                amount0 = +(-steps[i][pathName].swap);
            }

            if (JSON.stringify(poolsUpdateValues).includes(poolAddress)) {
                let arrayIndex = poolsUpdateValues.findIndex(x => x.pool === poolAddress);
                poolsUpdateValues[arrayIndex].assets[0].amount += amount0;
                poolsUpdateValues[arrayIndex].assets[1].amount += amount1;
            } else {
                poolsUpdateValues.push({
                    "pool": poolAddress,
                    "assets": [{
                            "amount": amount0
                        },
                        {
                            "amount": amount1
                        }
                    ]
                });
            }
            step_spread_multiplier = step_spread_multiplier * steps[i][pathName].ask_offer;
        }
        isReverse ? steps[i].spread = 0 : steps[i].spread = Math.trunc(((fval / n) * step_spread_multiplier) - steps[i].price);
        total_spread += steps[i].spread;
        // total_comission += steps[i].price * (fee_rate ** steps[i].steps);
    }

    // construction of output array that sums up all steps
    let poolsTotal = [];
    poolsUpdateHook: for (let i = 0; i < steps.length; i++) {
        let path = "";
        for (let j = 0; j < steps[i].steps; j++) {
            let pathName = "path" + (j + 1);
            steps[i][pathName].rate = steps[i][pathName].price / steps[i][pathName].startPrice;
            path += steps[i][pathName].poolAddress; // construction of "path" hash that is unique to each path (concatenation of each setp's poolAddress)
        }
        steps[i].path = path;

        if (poolsTotal.length === 0) {
            let stepsTemp = JSON.parse(JSON.stringify(steps[i]));
            poolsTotal.push(stepsTemp);
            poolsTotal[0].portionOfTotal = 1 / n;
        } else {
            for (let j = 0; j < poolsTotal.length; j++) {
                if (poolsTotal[j].path === steps[i].path) { // tries to find path in poolsTotal array
                    poolsTotal[j].price += +steps[i].price; // adds step's price to path's price
                    poolsTotal[j].portionOfTotal = Math.round(100*(poolsTotal[j].portionOfTotal * n + 1) / n)/100; // adds step's portion of total to path's portion of total
                    for (let k = 0; k < poolsTotal[j].steps; k++) { // adds step's steps to path's steps
                        let pathName = "path" + (k + 1);
                        poolsTotal[j][pathName].startPrice += +steps[i][pathName].startPrice;
                        poolsTotal[j][pathName].price += +steps[i][pathName].price;
                        poolsTotal[j][pathName].rate = poolsTotal[j][pathName].price / poolsTotal[j][pathName].startPrice;
                    }
                    continue poolsUpdateHook;
                }
            }
            let stepsTemp = JSON.parse(JSON.stringify(steps[i]));
            poolsTotal.push(stepsTemp); // if path is not found in poolsTotal array, adds new path to array
            poolsTotal[poolsTotal.length - 1].portionOfTotal = 1 / n;
        }
    }

    // sort poolsTotal by portionOfTotal
    poolsTotal.sort(function (a, b) {
        return b.portionOfTotal - a.portionOfTotal;
    });

    if (isReverse) {
        let _poolsTotal = JSON.parse(JSON.stringify(poolsTotal));
        for (let i = 0; i < _poolsTotal.length ; i++) {
            if (_poolsTotal[i].steps === 1) {

            } else if (_poolsTotal[i].steps === 2) {
                poolsTotal[i].path1 = _poolsTotal[i].path2
                poolsTotal[i].path2 = _poolsTotal[i].path1
            } else if (_poolsTotal[i].steps === 3) {
                poolsTotal[i].path1 = _poolsTotal[i].path3
                poolsTotal[i].path3 = _poolsTotal[i].path1
            }
        }
        _poolsTotal = JSON.parse(JSON.stringify(poolsTotal));
        for (let i = 0; i < _poolsTotal.length ; i++) {
            for (let j = 1; j <= poolsTotal[i].steps; j++){
                let pathName = "path" + (j);
                poolsTotal[i][pathName].price = _poolsTotal[i][pathName]?.startPrice;
                poolsTotal[i][pathName].startPrice = _poolsTotal[i][pathName]?.price;
                poolsTotal[i][pathName].rate = poolsTotal[i][pathName]?.price / poolsTotal[i][pathName]?.startPrice;
            }
        }
    }

    // console.log("poolsTotal", poolsTotal);
    // console.log("final steps:", steps, price);

    let simulated;
    let simulatedamount = price;
    let simulatedprice = !isReverse ? fval / price : price/fval;
    let simulatedcomission = 0;
    let simulatedspread = total_spread;
    simulated = {
        amount: simulatedamount,
        spread: simulatedspread,
        commision: simulatedcomission,
        price: simulatedprice
    };

    loading = false;

    poolDataList = [];

    return {
        load: null,
        simulated,
        error,
        loading,
        route: poolsTotal
    };
}

async function routeStepCommonReverse(addressFrom, addressTo, fval, steps) { //route thru common pools
    let paths = [];
    let path1 = [];

    //first step
    for (let index1 = 0; index1 < routers.length; index1++) {
        let addressStep1;
        if (true) {
            addressStep1 = commonTokens.slice();
            addressStep1.push(addressFrom);
            for (let i = 0; i < addressStep1.length; i++) {
                let getNextAddresses = await getNextAddress(addressTo, index1);
                // console.log("getNextAddresses", getNextAddresses, addressTo);
                if (!getNextAddresses.includes(addressStep1[i])) {
                    addressStep1.splice(i, 1);
                }
            }
            if (addressStep1.includes(addressTo)) {
                addressStep1.splice(addressStep1.indexOf(addressTo), 1);
            }
        } else {}
        path1Loop: for (let i = 0; i < addressStep1.length; i++) {
            let [price1, swap1, spread1, ask_offer1] = await xykPriceFromTo(fval, getTokenByAddress(addressStep1[i]), getTokenByAddress(addressTo), index1, steps);
            // eslint-disable-next-line
            if (+price1 === 0) {
                continue path1Loop;
            } // if returning price is 0, skip this pool
            for (let k = 0; k < path1.length; k++) {
                if (addressStep1[i] === path1[k].from) {
                    if (index1 !== 1 && path1[k].dex !== 1) {
                        if (+price1 < path1[k].price) {
                            path1.splice(k, 1); // path is repeated, but current price is better that previous price, so remove previous path
                        } else {
                            continue path1Loop; // path is repeated, but current price is not better than previous price, so skip this path
                        }
                    } else {
                        if (+price1 < path1[k].price) {
                            path1.splice(k, 1); // path is repeated, current path is Loops's, but current price is better that previous price, so remove previous path
                        } else {
                            // console.log("current price is less than previous price, but one of DEXs is LOOP"); // we keep both paths
                        }
                    }
                }
            }
            path1 = path1.concat({
                "dex": index1,
                "poolAddress": pairContractAddress(addressStep1[i], addressTo, index1),
                "from": addressStep1[i],
                "to": addressTo,
                "price": +price1,
                "startPrice": (+fval),
                "swap": +swap1,
                "spread": +spread1,
                "ask_offer": +ask_offer1
            });
        }
    }

    //second step
    let path2 = [];
    for (let j = 0; j < path1.length; j++) {
        if (path1[j].from === addressFrom) {
            paths = paths.concat({
                "steps": 1,
                "path1": path1[j],
                "price": path1[j].price
            }); // second token of path1 is addressTo, add path to final array and skip the following
        } else {
            for (let index2 = 0; index2 < routers.length; index2++) {
                let addressStep2;
                addressStep2 = commonTokens.slice();
                if (getNextAddress(path1[j].from, index2).includes(addressFrom)) {
                    addressStep2.push(addressFrom);
                }
                if (addressStep2.includes(path1[j].from)) {
                    addressStep2.splice(addressStep2.indexOf(path1[j].from), 1);
                }
                path2Loop: for (let i = 0; i < addressStep2.length; i++) {
                    let nextStepAddresses = [];
                    if (addressStep2[i] === addressTo) {
                        continue; // if addressStep2 is addressFrom, skip this pool
                    }
                    for (let n = 0; n < routers.length; n++) {
                        nextStepAddresses = nextStepAddresses.concat(getNextAddress(addressStep2[i], n));
                    }
                    if (addressStep2[i] === addressFrom || nextStepAddresses.includes(addressFrom)) { // only continue if addressTo is in current or next step
                        let [price2, swap2, spread2, ask_offer2] = await xykPriceFromTo(path1[j].price, getTokenByAddress(addressStep2[i]), getTokenByAddress(path1[j].from), index2, steps);
                        if (+price2 === 0) { // if returning price is 0, skip this pool
                            continue;
                        }
                        for (let k = 0; k < path2.length; k++) {
                            if (addressStep2[i] === path2[k].from) {
                                if (index2 !== 2 && path2[k].dex !== 2) {
                                    if (+price2 < path2[k].price) {
                                        path2.splice(k, 1);
                                    } else {
                                        continue path2Loop;
                                    }
                                } else {
                                    if (+price2 < path2[k].price) {
                                        path2.splice(k, 1);
                                    } else {}
                                }
                            }
                        }
                        path2 = path2.concat({
                            "dex": index2,
                            "poolAddress": pairContractAddress(path1[j].from, addressStep2[i], index2),
                            "from": addressStep2[i],
                            "to": path1[j].from,
                            "price": +price2,
                            "startPrice": path1[j].price,
                            "swap": +swap2,
                            "spread": +spread2,
                            "ask_offer": +ask_offer2
                        });
                    } else {
                        //console.log("not next step", addressStep2[i], addressTo);
                    }
                }
            }
        }
    }

    //third step
    let path3 = [];
    for (let j = 0; j < path2.length; j++) {
        if (path2[j].from === addressFrom) {
            let path1j = path1.filter(item => item.from === path2[j].to);
            paths = paths.concat({
                "steps": 2,
                "path1": path1j.reduce((prev, current) => prev.price < current.price ? prev : current),
                "path2": path2[j],
                "price": path2[j].price
            });
        } else {
            for (let index3 = 0; index3 < routers.length; index3++) {
                let addressStep3 = getNextAddress(path2[j].from, index3);
                for (let i = 0; i < addressStep3.length; i++) {
                    if (addressStep3[i] !== addressFrom) {
                        continue;
                    }
                    let [price3, swap3, spread3, ask_offer3] = await xykPriceFromTo(path2[j].price, getTokenByAddress(addressStep3[i]), getTokenByAddress(path2[j].from), index3, steps);
                    if (+price3 === 0) {
                        continue;
                    }
                    path3 = path3.concat({
                        "dex": index3,
                        "from": addressStep3[i],
                        "to": path2[j].from,
                        "price": +price3,
                        "startPrice": path2[j].price,
                        "swap": +swap3,
                        "spread": +spread3,
                        "ask_offer": +ask_offer3
                    });
                    let path1j = path1.filter(item => item.from === path2[j].to);
                    paths = paths.concat({
                        "steps": 3,
                        "path1": path1j.reduce((prev, current) => prev.price < current.price ? prev : current),
                        "path2": path2[j],
                        "path3": {
                            "dex": index3,
                            "poolAddress": pairContractAddress(path2[j].from, addressStep3[i], index3),
                            "from": addressStep3[i],
                            "to": path2[j].from,
                            "price": +price3,
                            "startPrice": path2[j].price,
                            "swap": +swap3,
                            "spread": +spread3,
                            "ask_offer": +ask_offer3
                        },
                        "price": +price3
                    });
                }
            }
        }
    }
    return paths.reduce((prev, current) => prev.price < current.price ? prev : current);
}

async function routeStepCommon(addressFrom, addressTo, fval, steps) { //route thru common pools
    let paths = [];
    let path1 = [];

    //first step
    for (let index1 = 0; index1 < routers.length; index1++) {
        let addressStep1;
        if (true) {
            addressStep1 = commonTokens.slice();
            addressStep1.push(addressTo);
            for (let i = 0; i < addressStep1.length; i++) {
                let getNextAddresses = await getNextAddress(addressFrom, index1);
                if (!getNextAddresses.includes(addressStep1[i])) {
                    addressStep1.slice(i, 1);
                }
            }
        } else {}
        path1Loop: for (let i = 0; i < addressStep1.length; i++) {
            let [price1, swap1, spread1, ask_offer1] = await xykPriceFromTo(fval, getTokenByAddress(addressFrom), getTokenByAddress(addressStep1[i]), index1, steps);
            // eslint-disable-next-line
            if (+price1 === 0) {
                continue path1Loop;
            } // if returning price is 0, skip this pool
            for (let k = 0; k < path1.length; k++) {
                if (addressStep1[i] === path1[k].to) {
                    if (index1 !== 2 && path1[k].dex !== 2) {
                        if (+price1 > path1[k].price) {
                            path1.splice(k, 1); // path is repeated, but current price is better that previous price, so remove previous path
                        } else {
                            continue path1Loop; // path is repeated, but current price is not better than previous price, so skip this path
                        }
                    } else {
                        if (+price1 > path1[k].price) {
                            path1.splice(k, 1); // path is repeated, current path is Loops's, but current price is better that previous price, so remove previous path
                        } else {
                            // console.log("current price is less than previous price, but one of DEXs is LOOP"); // we keep both paths
                        }
                    }
                }
            }
            path1 = path1.concat({
                "dex": index1,
                "poolAddress": pairContractAddress(addressFrom, addressStep1[i], index1),
                "from": addressFrom,
                "to": addressStep1[i],
                "price": +price1,
                "startPrice": (+fval),
                "swap": +swap1,
                "spread": +spread1,
                "ask_offer": +ask_offer1
            });
        }
    }

    //second step
    let path2 = [];
    for (let j = 0; j < path1.length; j++) {
        if (path1[j].to === addressTo) {
            paths = paths.concat({
                "steps": 1,
                "path1": path1[j],
                "price": path1[j].price
            }); // second token of path1 is addressTo, add path to final array and skip the following
        } else {
            for (let index2 = 0; index2 < routers.length; index2++) {
                let addressStep2;
                addressStep2 = commonTokens.slice();
                if (getNextAddress(path1[j].to, index2).includes(addressTo)) {
                    addressStep2.push(addressTo);
                }
                if (addressStep2.includes(path1[j].to)) {
                    addressStep2.slice(addressStep2.indexOf(path1[j].to), 1);
                }
                path2Loop: for (let i = 0; i < addressStep2.length; i++) {
                    let nextStepAddresses = [];
                    if (addressStep2[i] === addressFrom) {
                        continue; // if addressStep2 is addressFrom, skip this pool
                    }
                    for (let n = 0; n < routers.length; n++) {
                        nextStepAddresses = nextStepAddresses.concat(getNextAddress(addressStep2[i], n));
                    }
                    if (addressStep2[i] === addressTo || nextStepAddresses.includes(addressTo)) { // only continue if addressTo is in current or next step
                        let [price2, swap2, spread2, ask_offer2] = await xykPriceFromTo(path1[j].price, getTokenByAddress(path1[j].to), getTokenByAddress(addressStep2[i]), index2, steps);
                        if (+price2 === 0) { // if returning price is 0, skip this pool
                            continue;
                        }
                        for (let k = 0; k < path2.length; k++) {
                            if (addressStep2[i] === path2[k].to) {
                                if (index2 !== 2 && path2[k].dex !== 2) {
                                    if (+price2 > path2[k].price) {
                                        path2.splice(k, 1);
                                    } else {
                                        continue path2Loop;
                                    }
                                } else {
                                    if (+price2 > path2[k].price) {
                                        path2.splice(k, 1);
                                    } else {}
                                }
                            }
                        }
                        path2 = path2.concat({
                            "dex": index2,
                            "poolAddress": pairContractAddress(path1[j].to, addressStep2[i], index2),
                            "from": path1[j].to,
                            "to": addressStep2[i],
                            "price": +price2,
                            "startPrice": path1[j].price,
                            "swap": +swap2,
                            "spread": +spread2,
                            "ask_offer": +ask_offer2
                        });
                    } else {
                        // console.log("not next step", addressStep2[i], addressTo);
                    }
                }
            }
        }
    }

    //third step
    let path3 = [];
    for (let j = 0; j < path2.length; j++) {
        if (path2[j].to === addressTo) {
            let path1j = path1.filter(item => item.to === path2[j].from);
            paths = paths.concat({
                "steps": 2,
                "path1": path1j.reduce((prev, current) => prev.price > current.price ? prev : current),
                "path2": path2[j],
                "price": path2[j].price
            });
        } else {
            for (let index3 = 0; index3 < routers.length; index3++) {
                let addressStep3 = getNextAddress(path2[j].to, index3);
                for (let i = 0; i < addressStep3.length; i++) {
                    if (addressStep3[i] !== addressTo) {
                        continue;
                    }
                    let [price3, swap3, spread3, ask_offer3] = await xykPriceFromTo(path2[j].price, getTokenByAddress(path2[j].to), getTokenByAddress(addressStep3[i]), index3, steps);
                    if (+price3 === 0) {
                        continue;
                    }
                    path3 = path3.concat({
                        "dex": index3,
                        "from": path2[j].to,
                        "to": addressStep3[i],
                        "price": +price3,
                        "startPrice": path2[j].price,
                        "swap": +swap3,
                        "spread": +spread3,
                        "ask_offer": +ask_offer3
                    });
                    let path1j = path1.filter(item => item.to === path2[j].from);
                    paths = paths.concat({
                        "steps": 3,
                        "path1": path1j.reduce((prev, current) => prev.price > current.price ? prev : current),
                        "path2": path2[j],
                        "path3": {
                            "dex": index3,
                            "poolAddress": pairContractAddress(path2[j].to, addressStep3[i], index3),
                            "from": path2[j].to,
                            "to": addressStep3[i],
                            "price": +price3,
                            "startPrice": path2[j].price,
                            "swap": +swap3,
                            "spread": +spread3,
                            "ask_offer": +ask_offer3
                        },
                        "price": +price3
                    });
                }
            }
        }
    }
    return paths.length > 0 ? paths.reduce((prev, current) => prev.price > current.price ? prev : current) : null;
}

// fval - start amount, from token, to token, index - DEX number
// returns the amount of token B when swapping fval of token A on DEX index (direct swap)
async function xykPriceFromTo(fval, fromToken, toToken, index, steps) {
    if (fromToken === toToken) {
        return [0, 0, 0, 0];
    }
    let poolAddress = pairContractAddress(fromToken.tokenAddress, toToken.tokenAddress, index);
    if (!poolAddress) {
        if (!steps) {
            return false;
        } else {
            return [false, false];
        }
    } // break if there's no pool for this pair con current dex
    try {
        let foundPool = false;
        let i = 0;
        let isStable = false;
        while (!foundPool) {
            let poolFound = routers[i].poolList.filter(item => item.swap_address === poolAddress);
            if (poolFound.length > 0) {
                JSON.stringify(poolFound).includes("pair_type\":{\"stable") ? isStable = true : isStable = false;
                foundPool = true;
            } else {
                i++;
            }
        }
        let [_poolData, ] = await poolDataLocal(poolAddress, false);
        if(_poolData === undefined){
           let index = 0;
           while (!_poolData && index < 3){

               let [_poolData,] = await poolDataLocal(poolAddress, false, true);
               index = index+1;
           }
        }
        // let amp = 0;
        if (!steps) {

        } else {
            // update balance with previous steps swaps
            for (let i = 0; i < steps.length; i++) {
                if (JSON.stringify(steps[i]).includes(poolAddress)) {
                    _poolData.token1_reserve = +_poolData.token1_reserve + steps[i].assets[0].amount;
                    _poolData.token2_reserve = +_poolData.token2_reserve + steps[i].assets[1].amount;
                }
            }
        }

        if(_poolData) {
            _poolData.dex = index;
        }

        if (!isReverse) {
            let simulation;
            if (isStable) {
                // simulation = stablePrice(_poolData, fromToken.tokenAddress, fval, amp);
            } else {
                simulation = await xykPrice(_poolData, fromToken.tokenAddress, fval); // returns price for xyk
            }
            if (!steps) {
                return simulation.return_amount;
            } else {
                return [simulation.return_amount, simulation.swap_amount, simulation.spread_amount, simulation.ask_offer];
            }
        } else {
            let reverseSimulation;
            if (isStable) {
                // reverseSimulation = reverseStablePrice(_poolData, toToken.tokenAddress, fval, amp);
            } else {
                reverseSimulation = await reverseXykPrice(_poolData, toToken.tokenAddress, fval); // returns price for xyk
            }
            if (!steps) {
                return reverseSimulation.offer_amount;
            } else {
                return [reverseSimulation.offer_amount, reverseSimulation.swap_amount, reverseSimulation.spread_amount, reverseSimulation.ask_offer];
            }
        }

    } catch (e) {
        console.log('error xykPriceFromTo', e);
        return false;
    }
}

// calculates output amount for a swap in X*Y=K type pool.
function xykPrice(_pool, _offerAsset, _offerAmount) {
    let offer_pool;
    let ask_pool;
    let askIsNative = false;
    const rd = JSON.stringify(_pool.token1_denom)
    if (rd && rd.includes(_offerAsset)) { // identifies offer and ask pools
        offer_pool = _pool.token1_reserve;
        ask_pool = _pool.token2_reserve;
        // if (JSON.stringify(_pool.assets[1].info).includes("native_token")) {
        //   askIsNative = true;
        // }
    } else if (_pool.token2_denom && JSON.stringify(_pool.token2_denom).includes(_offerAsset)) {
        offer_pool = _pool.token2_reserve;
        ask_pool = _pool.token1_reserve;
        // if (JSON.stringify(_pool.assets[0].info).includes("native_token")) {
        //   askIsNative = true;
        // }
    } else {
        return console.log('unknown asset');
    }

    let fee_info = _pool.dex === 1 ? 0.01 : 0.003; // 1% for loop, 0.3% for others
    let offer_amount = _offerAmount;

    // XYK formula
    let cp = offer_pool * ask_pool;
    let swap_amount = Math.trunc(ask_pool - (cp / (+offer_pool + +offer_amount)));
    let spread_amount = (offer_amount * (ask_pool / offer_pool)) - swap_amount;
    let commission_amount = swap_amount * fee_info;
    let return_amount = Math.trunc(swap_amount - commission_amount);

    // calculates tobin tax - currently disabled
    // let tobin_tax = 0.0035;
    // askIsNative ? return_amount =  Math.trunc(return_amount * (1 - +tobin_tax)) : return_amount = return_amount;
    return {
        "return_amount": return_amount,
        "spread_amount": spread_amount,
        "swap_amount": swap_amount,
        "askIsNative": askIsNative,
        "ask_offer": (ask_pool / offer_pool)
    };
}

function reverseStablePrice(_pool, _askAsset, _askAmount, amp) {
    // console.log('stablePrice', _pool, _askAsset, _askAmount, amp);
    let offer_pool;
    let ask_pool;
    let askIsNative = false;
    if (JSON.stringify(_pool.assets[0]).includes(_askAsset)) { // identifies offer and ask pools
        ask_pool = _pool.assets[0].amount;
        offer_pool = _pool.assets[1].amount;
        if (JSON.stringify(_pool.assets[0].info).includes("native_token")) {
            askIsNative = true;
        }
    } else if (JSON.stringify(_pool.assets[1]).includes(_askAsset)) {
        ask_pool = _pool.assets[1].amount;
        offer_pool = _pool.assets[0].amount;
        if (JSON.stringify(_pool.assets[1].info).includes("native_token")) {
            askIsNative = true;
        }
    } else {
        return console.log('unknown asset');
    }

    let fee_info = _pool.dex === 1 ? 0.01 : 0.0005; // 1% for loop, 0.05% for others
    let ask_amount = _askAmount;
    let amount_a = offer_pool;
    let amount_b = ask_pool;

    let _amp = JSBI.BigInt(amp);
    let _amount_a = JSBI.BigInt(amount_a);
    let _amount_b = JSBI.BigInt(amount_b);
    // let _ask_amount = JSBI.BigInt(ask_amount);

    let requiredY = amount_b - ask_amount * (1 + fee_info);
    let _requiredY = JSBI.BigInt(Math.trunc(requiredY));

    let _temp_offer_amount = JSBI.BigInt(Math.trunc(ask_amount * amount_a / amount_b));
    let _d = computeD(_amp, _amount_a, _amount_b);

    let loop = 0;
    while (true) {
        let _y = computeY(
            _amp,
            JSBI.add(_amount_a, _temp_offer_amount),
            _d
        )

        let abs;
        if (JSBI.greaterThan(JSBI.subtract(_y, _requiredY), JSBI.BigInt(0))) {
            abs = JSBI.subtract(_y, _requiredY);
        } else {
            abs = JSBI.unaryMinus(JSBI.subtract(_y, _requiredY));
        }

        let tolerance = JSBI.BigInt(1);

        if (JSBI.lessThanOrEqual(abs, tolerance)) {
            break;
        } else {
            if (JSBI.greaterThan(_y, _requiredY)) {
                _temp_offer_amount = JSBI.add(_temp_offer_amount, abs);
            } else {
                _temp_offer_amount = JSBI.subtract(_temp_offer_amount, abs);
            }
        }

        loop++;
        if (loop > 2000) {
            console.log('stable reverse: required', JSBI.toNumber(_requiredY), 'current y', JSBI.toNumber(_y), 'at loop N', loop);
            console.log('stable reverse: loop limit reached');
            _temp_offer_amount = JSBI.BigInt(0);
            break;
        }
    }

    let offer_amount = Math.trunc(JSBI.toNumber(_temp_offer_amount));

    let swap_amount = Math.trunc(ask_amount * (1 + fee_info)) + 1;
    let spread_amount = (offer_amount * (ask_pool / offer_pool)) - swap_amount;

    offer_amount < 0 ? offer_amount = 0 : offer_amount = offer_amount;

    return {
        "offer_amount": offer_amount,
        "spread_amount": spread_amount,
        "swap_amount": swap_amount,
        "askIsNative": askIsNative
    };
}

function reverseXykPrice(_pool, _askAsset, _askAmount) {
    // console.log('reverseXykPrice', _pool, _askAsset, _askAmount);
    let offer_pool;
    let ask_pool;
    let askIsNative = false;
    if (JSON.stringify(_pool.token1_denom).includes(_askAsset)) { // identifies offer and ask pools
        ask_pool = _pool.token1_reserve;
        offer_pool = _pool.token2_reserve;
    } else if (JSON.stringify(_pool.token2_denom).includes(_askAsset)) {
        ask_pool = _pool.token2_reserve;
        offer_pool = _pool.token1_reserve;
    } else {
        return console.log('unknown asset');
    }

    let fee_info = _pool.dex === 1 ? 0.01 : 0.003; // 1% for loop, 0.3% for others
    let ask_amount = _askAmount;

    let cp = offer_pool * ask_pool;
    let one_minus_commission = +1 - fee_info;
    let inv_one_minus_commission = +1 / one_minus_commission;
    let offer_amount = Math.trunc((cp / (ask_pool - (ask_amount * inv_one_minus_commission))) - offer_pool) + 1;
    let before_commission_deduction = ask_amount * inv_one_minus_commission;
    let spread_amount = (offer_amount * (ask_pool / offer_pool)) - before_commission_deduction;
    let commission_amount = before_commission_deduction * fee_info;
    let swap_amount = Math.trunc(ask_amount + commission_amount) + 1;
    offer_amount < 0 ? offer_amount = 0 : offer_amount = offer_amount;

    return {
        "offer_amount": offer_amount,
        "spread_amount": spread_amount,
        "swap_amount": swap_amount,
        "askIsNative": askIsNative,
        "ask_offer": (ask_pool / offer_pool)
    };
}