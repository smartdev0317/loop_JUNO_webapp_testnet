import { useEffect, useState } from "react"
import { div } from "../../libs/math"
import { Type } from "../../pages/Exchange"
import poolList from './poolList.json';
const {
  CosmWasmClient
} = require("@cosmjs/cosmwasm-stargate");
const {
  Tendermint34Client,
  HttpClient
} = require("@cosmjs/tendermint-rpc");

interface Params {
  amount: string
  token: string
  tokenTo: string
  reverse: boolean
  type: Type
  dex: number
}

interface SimulatedData {
  token1_amount: string,
  token2_amount: string
}

interface Simulated {
  amount: string
  price: string
}
interface CONTRACTType {
  pair: string
  denom?: string
  isNative: boolean
  contract_addr: string
  tokenSymbol?: string
  tokenName?: string
}

export default ({ amount: value, token, tokenTo, reverse, type = Type.SWAP, dex = 0 }: Params) => {
  const [someData, setSomeData] = useState({});

  const fetchRSD = async () => {
      try {
          let data = await DexSim({ amount: value, token, tokenTo, reverse, type: Type.SWAP, dex: 0 });
          setSomeData(data);
      } catch (e) {
          console.log('error dexSimulation.js fetchRSD:', e);
      }
  }

  useEffect(() => {
      if (value > "0") {
          setSomeData({ load: null, simulated: { amount: 0, price: 0 }, error: false, loading: true, route: null });
          const timeOutId = setTimeout(() => fetchRSD(), 0);
          return () => clearTimeout(timeOutId);
      } else {
          setSomeData({ load: null, simulated: { amount: 0, price: 0 }, error: false, loading: false, route: null });
      }
  }, [token, tokenTo, value, dex, reverse]);

  return someData;
}


export const useDexSimulation = ({ amount: value, token, tokenTo, reverse, type = Type.SWAP, dex = 0 }: Params) => {
  const [someData, setSomeData] = useState({});

  const fetchRSD = async () => {
    try {
      let data = await DexSim({ amount: value, token, tokenTo, reverse, type: Type.SWAP, dex: 0 });
      setSomeData(data);
    } catch (e) {
      console.log('error dexSimulation.js fetchRSD:', e);
    }
  }

  useEffect(() => {
    if (value > "0") {
      setSomeData({ load: null, simulated: { amount: 0, price: 0 }, error: false, loading: true, route: null });
      const timeOutId = setTimeout(() => fetchRSD(), 0);
      return () => clearTimeout(timeOutId);
    } else {
      setSomeData({ load: null, simulated: { amount: 0, price: 0 }, error: false, loading: false, route: null });
    }
  }, [token, tokenTo, value, dex, reverse]);

  return someData;
}

async function DexSim ({ amount: value, token, tokenTo, reverse, type = Type.SWAP, dex = 0 }: Params) {
  // const [simulated, setSimulated] = useState<Simulated>()

  // useEffect(() => {
  //   setSimulated(undefined)
  // }, [token, tokenTo, value])

  /* context */
  // const { toPlainString } = useProtocol()

  // const amount = toPlainString(value)
  const amount = value;
  const routerName = dex === 0 ? "juno" : dex === 1 ? "loop" : 'wynd'

  function getPool(addressFrom, addressTo) {
    return poolList[routerName].filter(item =>
      JSON.stringify(item.pool_assets).includes(JSON.stringify(addressFrom)) &&
      JSON.stringify(item.pool_assets).includes(JSON.stringify(addressTo)));
  }

  const pools = getPool(token, tokenTo)
  let poolExists = true

  // let pool = {
  //   "pool_id": "",
  //   "pool_assets": [
  //     {
  //       "id": "",
  //       "chain_id": "",
  //       "token_address": "",
  //       "symbol": "",
  //       "name": "",
  //       "decimals": 6,
  //       "logoURI": "",
  //       "native": true,
  //       "denom": ""
  //     },
  //     {
  //       "id": "",
  //       "chain_id": "",
  //       "token_address": "",
  //       "symbol": "",
  //       "name": "",
  //       "decimals": 6,
  //       "logoURI": "",
  //       "native": true,
  //       "denom": ""
  //     }
  //   ],
  //   "swap_address": "",
  //   "staking_address": "",
  //   "rewards_tokens": [
  //     {
  //       "rewards_address": "",
  //       "token_address": "",
  //       "swap_address": "",
  //       "symbol": "",
  //       "name": "",
  //       "logoURI": "",
  //       "native": true,
  //       "denom": "",
  //       "decimals": 6
  //     },
  //     {
  //       "rewards_address": "",
  //       "token_address": "",
  //       "swap_address": "",
  //       "symbol": "",
  //       "name": "",
  //       "logoURI": "",
  //       "native": true,
  //       "denom": "",
  //       "decimals": 6
  //     }
  //   ]
  // }
  if (pools.length === 0) {
    return { load: null, simulated: { amount: 0, price: 0 }, error: false, loading: false, route: null }
  }

  let pool = pools[0]

  const isTokenOne = poolExists ? JSON.stringify(pool.pool_assets[0]).includes(JSON.stringify(token)) : false

  const fromOneToTwo = isTokenOne

  const variablesJuno = fromOneToTwo
    ? { token1_for_token2_price: { token1_amount: amount } }
    : { token2_for_token1_price: { token2_amount: amount } }

  // const { client } = useRecoilValue(walletState)
  //const junoEndpoint = "https://rpc-juno.itastakers.com/";
  const junoEndpoint = "https://rpc-juno.mib.tech/";
  const tmClient = new Tendermint34Client(new HttpClient(junoEndpoint));
  const client = new CosmWasmClient(tmClient);
  const address = pool?.swap_address ?? ""

  // const { data, isLoading, refetch, error } = useQuery<SimulatedData>(
  //   '@token-list',
  //   async () => {
  //     if (client && address) {
  //       try {
  //         const data: SimulatedData = await client.queryContractSmart(!address || address.length <= 0 ? '' : address, variablesJuno)
  //         return data
  //       } catch (e) {
  //         return { token1_amount: "0", token2_amount: "0" }
  //       }
  //     }
  //   },
  //   {
  //     onError(e) {
  //       console.error('Error loading token list:', e)
  //     },
  //     refetchOnMount: true,
  //     refetchIntervalInBackground: true,
  //     refetchInterval: 1000 * 60,
  //   }
  // )
  const parsed = await client.queryContractSmart(!address || address.length <= 0 ? '' : address, variablesJuno)
  let refetch = () => { }
  let error = null
  let isLoading = false

  // useEffect(() => {
  //   if (value > "0") {
  //     refetch()
  //   }
  // }, [value])

  // console.log("dexsSimulation parsed", variablesJuno, parsed)

  const simulatedAmount = fromOneToTwo
    ? parsed?.token2_amount
    : parsed?.token1_amount

  // const spread = parsed?.spread_amount
  // const commission = parsed?.commission_amount

  const price = {
    [Type.SWAP]: !reverse
      ? div(amount, simulatedAmount)
      : div(simulatedAmount, amount),
    [Type.SELL]: !reverse
      ? div(simulatedAmount, amount)
      : div(amount, simulatedAmount),
  }[type]

  // useEffect(() => {
  //   error
  //     ? setSimulated(undefined)
  //     : simulatedAmount &&
  //     // spread &&
  //     // commission &&
  //     price &&
  //     setSimulated({ amount: simulatedAmount, price })
  // }, [simulatedAmount, price, error, isLoading])

  let simulated = { amount: simulatedAmount, price }

  // console.log("dexsSimulation Return", refetch, simulated, error, loading)

  return poolExists ? { load: refetch, simulated, error, isLoading } : { load: refetch, simulated: undefined, error: undefined, isLoading: undefined }
}
