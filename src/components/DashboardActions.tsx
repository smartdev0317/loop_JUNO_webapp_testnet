import { Link, LinkProps } from "react-router-dom"
import Tippy from "@tippyjs/react"
import Tooltip, { DropdownTippyProps } from "./Tooltip"
import Icon from "./Icon"
import Dropdown from "./Dropdown"
import styles from "./DashboardActions.module.scss"
import Button from "./Button"
import { addTokenToKeplr } from "../helpers/addTokenToKeplr"
import farm_icon from "../images/new_farm_icon.svg"
import { useWallet } from "@noahsaso/cosmodal"

const DashboardActions = ({
  list,
  disabled,
  className,
  showAddTokenBtn,
  token,
}: {
  list: LinkProps[]
  disabled?: boolean
  className?: string
  showAddTokenBtn?: boolean
  token?: string
}) => {
  const links = list.filter(({ to }) => !!to).map((item) => <Link {...item} />)
const { walletClient,status } = useWallet()

  const addTokenBtn = showAddTokenBtn &&
    token ===
      "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup" && (
      <a
        children={<>Add LOOP to Keplr</>}
        style={{ cursor: "pointer" }}
        onClick={() =>
          addTokenToKeplr(
            "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup",
            walletClient,
            status
          )
        }
      />
    )

  const newLinksList = [...links, addTokenBtn]

  return (
    <>
      {disabled ? (
        <Tooltip content="coming soon">
          <button className={className ? className : styles.trigger}>
            <Icon name="more_horiz" size={18} />
          </button>
        </Tooltip>
      ) : (
        <Tippy
          {...DropdownTippyProps}
          render={() => <Dropdown list={newLinksList} />}
        >
          <button className={className ? className : styles.trigger}>
            <Icon name="more_horiz" size={18} />
          </button>
        </Tippy>
      )}
      {/* {showAddTokenBtn && (
     
      )} */}
    </>
  )
}

export default DashboardActions
