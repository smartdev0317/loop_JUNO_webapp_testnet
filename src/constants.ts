/* terra:network */
import { ExtNetworkConfig } from "./types/network"

export const DEFAULT_FEE_NUM = 5.0
export const FINDER = "https://finder.terra.money"
export const EXTENSION = "https://terra.money/extension"
export const CHROME = "https://google.com/chrome"
export const DOCS = "https://loop.markets"
export const CDN = "https://loop-markets.sfo3.cdn.digitaloceanspaces.com/"

/* terra:configs */
export const BLOCK_TIME = 6500 // 6.5s

/* Loop fee */
export const MIN_FEE = 2

/* loop:unit */
export const SMALLEST = 1e6
export const LOOP = "LOOP"
export const LOOPR = "LOOPR"
export const ANC = "ANC"
export const ULUNA = "ULUNA"
export const LUNA = "LUNA"
export const BLUNA = "BLUNA"
export const MINE = "MINE"
export const AUST = "AUST"
export const UUSD = "uusd"
export const UST = "UST"
export const hour = "24h"
export const LP = "LP"
export const HALO = "HALO"
export const DPH = "DPH"
export const LUV = "LUV"
export const LDO = "LDO"
export const ARTS = "ARTS"
export const JUNOX="JUNOX"
export const UJUNO="ujuno"
export const UJUNOX="ujunox"
export const USDC="USDC"
export const JUT="JUT"
export const JUNO="JUNO"

export const USDC_addr="ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034"
export const LOOP_addr="juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup"
export const SGNL_addr = "juno14lycavan8gvpjn97aapzvwmsj8kyrvf644p05r0hu79namyj3ens87650k"
export const SEASY_addr = "juno19rqljkh95gh40s7qdx40ksx3zq5tm4qsmsrdz9smw668x9zdr3lqtg33mf"
export const BJUNO_addr="juno1wwnhkagvcd3tjz6f8vsdsw5plqnw8qy2aj3rrhqr2axvktzv9q2qz8jxn3"

export const aUST_TOKEN = "terra1hzh9vpxhsk8253se0vv5jj6etdvxu3nv8z07zu"
export const LOOP_SGNL_PAIR = "juno1mz8yzrgyp9mmq9aksxgpy83vmu8p4j8h3qyf9waxcd2epchqx5ps0ekj27"

/* mirror:configs */
export const GENESIS = 1607022000000
export const MAX_SPREAD = 0.01
export const MAX_MSG_LENGTH = 4096
export const COMMISSION = 0.003

/* network:settings */
export const PRICES_POLLING_INTERVAL = 20000
export const TX_POLLING_INTERVAL = 1000
export const DEFAULT_EXT_NETWORK: ExtNetworkConfig = {
  name: "mainnet",
  chainID: "columbus-4",
  lcd: "https://lcd.terra.dev",
}
export const GAUGE_ADDRESS="juno18kvahfjnn2kmjvae3hmmgff8gn65swcf8tk83twlfu5hr2qrjwns7k4x4z"
/* outbound */
export const TRADING_HOURS =
  "https://www.nasdaq.com/stock-market-trading-hours-for-nasdaq"

/* sentry */
export const DSN =
  "https://b1532961e54e491fbb57e67805cb36a4@o247107.ingest.sentry.io/5540998"

/* terra:wasm */
export const WASMQUERY = "WasmContractsContractAddressStore"
