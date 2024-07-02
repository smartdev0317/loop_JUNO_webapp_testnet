import { useRecoilValue } from "recoil"
import { walletState} from  '../state/walletAtoms'

const useAddress = () => {
  const { address } = useRecoilValue(walletState)
  return address
}

export default useAddress
