import TxLink from "../components/TxLink"
import useNetwork from "../hooks/useNetwork";

const TxHash = ({ children: hash }: { children: string }) => {
  return <TxLink hash={hash} link={`https://www.mintscan.io/juno/txs/${hash}`} />
}

export default TxHash
