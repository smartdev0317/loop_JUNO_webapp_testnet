import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import { walletState } from "../../state/walletAtoms"
import { CHAIN_INFO } from "../../data/contract/juno_queries"
import { useWalletManager, WalletConnectionStatus } from '@noahsaso/cosmodal'

export const useJunoConnectedWallet = (
  mutationOptions?: Parameters<typeof useMutation>[2]
) => {
  const [{ status }, setWalletState] = useRecoilState(walletState)
  const {connectedWallet}=useWalletManager()


  const mutation = useMutation(async () => {
  
    /* set the fetching state */
    setWalletState((value) => ({
      ...value,
      client: null,
      state: WalletConnectionStatus.Connecting,
    }))

    try {
      await window.keplr.experimentalSuggestChain(CHAIN_INFO)
      await window.keplr.enable(CHAIN_INFO.chainId)

      let wasmChainClient = await SigningCosmWasmClient.connectWithSigner(
        CHAIN_INFO.rpc,
        connectedWallet.offlineSigner
      )

      const [{ address }] = await connectedWallet.offlineSigner.getAccounts()
      const key = await window.keplr.getKey(CHAIN_INFO.chainId)
      
      /* successfully update the wallet state */
      setWalletState({
        key,
        address,
        client: wasmChainClient,
        status: WalletConnectionStatus.Connected
      })
    } catch (e) {
      
      /* set the error state */
      setWalletState({
        key: null,
        address: '',
        client: null,
        status: WalletConnectionStatus.Errored,
      })

      /* throw the error for the UI */
      throw e
    }
  }, mutationOptions)

  useEffect(() => {
    /* restore wallet connection if the state has been set with the */
    if (CHAIN_INFO?.rpc && [WalletConnectionStatus.AttemptingAutoConnection, WalletConnectionStatus.Connected].includes(status)) {
      mutation.mutate(null)
    }
  }, [status, CHAIN_INFO?.rpc]) // eslint-disable-line

  useEffect(() => {
    function reconnectWallet() {
      if ([WalletConnectionStatus.AttemptingAutoConnection, WalletConnectionStatus.Connected].includes(status)) {
        mutation.mutate(null)
      }
    }

    window.addEventListener('keplr_keystorechange', reconnectWallet)
    return () => {
      window.removeEventListener('keplr_keystorechange', reconnectWallet)
    }
  }, [status]) // eslint-disable-line

  return mutation
}