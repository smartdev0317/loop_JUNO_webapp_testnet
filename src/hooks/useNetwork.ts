import {FINDER } from "../constants"
import networks, { defaultNetwork } from "../networks"

const useNetwork = () => {
  const extNetwork = defaultNetwork
  const network = extNetwork ? networks[extNetwork.name] : networks[defaultNetwork.name.toString()]

  const finder = (address: string, path: string = "account") =>
      `${FINDER}/${extNetwork.chainID}/${path}/${address}`

  return { ...extNetwork, ...network, finder }
}

export default useNetwork