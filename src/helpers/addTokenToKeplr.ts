export const addTokenToKeplr = async (token_addr: string,walletClient,status) => {

  if (status!==4) {
    throw new Error("Keplr extension is not available")
  }

  await walletClient?.suggestToken("juno-1", token_addr)
}
