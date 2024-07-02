
/* find the first value by key */
import { USDC } from "../../constants";
import { nativeDenom } from "../../data/contract/juno_queries";
import {Attribute, TxEvent, TxLog} from "../../types/tx";

export const findValueFromLogs =
  (logs: TxLog[]) =>
    (key: string, index = 0) => {
      const attribute = logs[index]?.events.find(
        (e) => e.type === "from_contract"
      )?.attributes

      return attribute?.find((attr) => attr.Key === key)?.Value ?? ""
    }

export const findValue = (logs: any[]) => (key: string, index = 0) => {
  const attribute = logs[0]?.events.find((e) => e.type === "wasm")?.attributes

  return attribute?.find((attr) => attr.key === key)?.value ?? ""
}

export const findUnstakeValues = (logs: any[]) => (key: string, index = 0) => {
  const attribute = logs[1]?.events.find((e) => e.type === "wasm")?.attributes

  return attribute?.find((attr) => attr.key === key)?.value ?? ""
}


export const fromContract = (logs: TxLog[]) =>
  logs.map(({ events }) => {
    const attributes = events.find(({ type }) => type === "from_contract")
      ?.attributes

    return attributes
      ?.reduce<FromContract[]>((acc, { Key, Value }) => {
        const sep = Key === "contract_address"
        const last = acc[acc.length - 1]
        return sep
          ? [...acc, { [Key]: Value }]
          : [...acc.slice(0, acc.length - 1), { ...last, [Key]: Value }]
      }, [])
      .reduce<Dict<FromContract>>(
        (acc, item) => ({ ...acc, [item.action]: item }),
        {}
      )
  })

export const parseEvents = (events: TxEvent[]) =>
  events.reduce<Dict<Dict<string>>>(
    (acc, { type, attributes }) => ({
      ...acc,
      [type]: parseAttributes(attributes),
    }),
    {}
  )

const parseAttributes = (attributes: Attribute[]) =>
  attributes.reduce((acc, { Key, Value }) => ({ ...acc, [Key]: Value }), {})

export const splitTokenText = (string = "") => {
  const [, amount, token] = string.split(/(\d+)(\w+)/)
  return { amount, token }
}

export const parseTokenText = (string?: string) =>
  string?.split(", ").map(splitTokenText) ?? []


export const concatFromContract = (logs: TxLog[]) => {
    return logs
        .map(({ events }) => {
            const attributes = events.find(
                ({ type }) => type === "from_contract"
            )?.attributes

            return attributes?.reduce<FromContract[]>((acc, { Key, Value }) => {
                const sep = Key === "contract_address"
                const last = acc[acc.length - 1]
                return sep
                    ? [...acc, { [Key]: Value }]
                    : [...acc.slice(0, acc.length - 1), { ...last, [Key]: Value }]
            }, [])
        })
        .reduce<FromContract[]>((acc = [], cur = []) => [...acc, ...cur], [])
}


export const findPathFromContract = (logs: TxLog[]) => {
    return (action: string) =>
        (key: string, index = 0) =>
            concatFromContract(logs)
                .filter((fc) => fc.action === action)
                .filter((fc) => fc[key])
                .map((fc) => fc[key])[index] ?? ""
}

export const getJunoTokenSymbol =(asset,tokensInfo)=>{


  const singleTokenInfo=tokensInfo.find((item:any) => item.token == asset);

  return singleTokenInfo ? singleTokenInfo.symbol : USDC
}