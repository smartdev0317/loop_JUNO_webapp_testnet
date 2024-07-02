import { useCallback, useMemo } from 'react'


import data from "../../token_list.testnet.json"

/* hook for base token info retrieval */
export const useBaseTokenInfo = () => {
  const tokenList = data?.base_token;
  return tokenList;
}