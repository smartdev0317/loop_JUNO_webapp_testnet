import { multiply } from "numeral"
import React, { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { multiple, plus } from "../../libs/math"
import { lookupSymbol } from "../../libs/parse"
import { MenuKey } from "../../routes"
const queryString = require("query-string")

declare const window: any

interface Props {
  asset?: string
  receipt?: any
  txFee?: string
  txHash?: string
  type?: any
}

const DataLayer = ({ asset, receipt, txFee, txHash, type }: Props) => {
  const dataLayer = (window.dataLayer = window.dataLayer || [])

  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname == "/dashboard") {
      const bought = receipt && receipt[1]?.content.split(" ")[0]
      const boughtTokenUnitPrice = receipt && receipt[0]?.boughtTokenUnitPrice

      dataLayer.push({
        event: "swap",
        event_category: "exchange",
        event_action: "swap",
        event_label: asset, //the pair of assets
        commission: receipt && receipt[1].children[1].content, //commission of the swap as revenue
        tx_hash: txHash, // transaction id
        value_from: receipt && receipt[2]?.offerAmount + " " + lookupSymbol(receipt[2]?.offerSymbol),
        value_to: receipt && receipt[1]?.content?.split(" ")[0],
        slippage: 0,
        tx_fee: txFee,
        spread: receipt && receipt[1]?.children[0]?.content,
        transaction_volume: `$${multiple(boughtTokenUnitPrice, bought)}`,
      })
    }
    if (pathname == "/") {
      const bought = receipt && receipt[1]?.content.split(" ")[0]
      const boughtTokenUnitPrice = receipt && receipt[0]?.boughtTokenUnitPrice

      dataLayer.push({
        event: "swap",
        event_category: "exchange",
        event_action: "swap",
        event_label: asset, //the pair of assets
        commission: receipt && receipt[1].children[1].content, //commission of the swap as revenue
        tx_hash: txHash, // transaction id
        value_from: receipt && receipt[2]?.offerAmount + " " + lookupSymbol(receipt[2]?.offerSymbol),
        value_to: receipt && receipt[1]?.content,
        slippage: 0,
        tx_fee: txFee,
        spread: receipt && receipt[1]?.children[0]?.content,
        transaction_volume: `$${multiple(boughtTokenUnitPrice, bought)}`,
      })
    }
    if (pathname == "/pool") {
      dataLayer.push({
        event: "pool",
        event_category: "exchange",
        event_action: "pool",
        event_label: receipt[0]?.pair, //the pair of assets
        tx_fee: txFee, //tx_fee deposited value
        tx_hash: txHash,
        value_received: receipt[0]?.content,
        value_deposited: receipt[1]?.content,
      })
    }
    if (pathname == "/stake") {
      const label = receipt && receipt[0]?.content
      const asset = label.split(" ")

      dataLayer.push({
        event: type,
        event_category: "exchange",
        event_action: type,
        event_label: asset[1], //the pair of assets
        tx_fee: txFee, //tx_fee value
        tx_hash: txHash,
        amount: asset[0],
      })
    }
    if (pathname == "/farm") {
      const value = receipt[0]?.content.substr(
        0,
        receipt[0]?.content.indexOf(" ")
      )
      const symbol = receipt[0]?.content.substr(
        receipt[0]?.content.indexOf(" ") + 1
      )
      dataLayer.push({
        event: "farm",
        event_category: "exchange",
        event_action: "farm",
        event_label: symbol, //the symbol
        event_value: value, //the actual value of LP tokens
        tx_hash: txHash,
        tx_fee: txFee,
      })
    }
  }, [])

  return <div></div>
}

export default DataLayer
