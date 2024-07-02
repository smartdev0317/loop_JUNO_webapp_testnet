
import networks, { defaultNetwork } from "../networks"

export const useLCDClient = () => {
  // const network =  defaultNetwork
  // const networkInfo = networks[network.name]
  /*const terra = new LCDClient({
    URL: networkInfo.lcd,
    chainID: network.chainID,
    gasAdjustment: 1.5,
  })*/

  return { terra: ()=>{} }
}
export default useLCDClient