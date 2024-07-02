import { useEffect, ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import classNames from "classnames/bind"
import Menu from "../theme/Menu"
import styles from "./AppHeader.module.scss"
import toggle_left_icon from "../../images/icons/toggle-left.png"
import twitter_icon from "../../images/icons/social/twitter.svg"
import telegram from "../../images/icons/social/telegram.svg"
import discord from "../../images/icons/social/discord.svg"
import reddit from "../../images/icons/social/redit.svg"
import collapse_icon from "../../images/collapse.svg"
import open_icon from "../../images/open.svg"
import expand_arrow from "../../images/icons/expand_arrow.svg"
import useLocalStorage from "../../libs/useLocalStorage"
import { useRecoilState } from "recoil"
import { menuCollapsed } from "../../data/app"
import Tooltip, { TooltipIcon } from "../Tooltip"

interface Props {
  logo: string
  smLogo?: string
  menu: MenuItem[]
  additionalMenu: MenuItem[]
  connect: ReactNode
  border?: boolean
  testnet?: boolean
  toggleSidebar: (status: boolean) => void
}

const AppHeader = ({
  logo,
  menu,
  additionalMenu,
  toggleSidebar,
  smLogo,
}: Props) => {
  const { key, pathname } = useLocation()
  const [isOpen, setIsOpen] = useLocalStorage("hideMenu", false)
  const [menuCollapsedState, setMenuCollapsedState] =
    useRecoilState(menuCollapsed)
  const toggle = () => {
    setMenuCollapsedState(!isOpen)
    setIsOpen(!isOpen)
  }
  // const hideToggle = menu.every((item) => item.desktopOnly)

  useEffect(() => {
    toggleSidebar(isOpen)
  }, [isOpen, toggleSidebar])
  return (
    <header
      className={classNames(
        styles.header,
        styles.headerSize,
        isOpen && styles.toggle_header
      )}
    >
      <div className={styles.logoHead}>
        <div
          className={classNames(
            styles.navWrap,
            isOpen && styles.navWrapCollapsed
          )}
        >
          <nav>
            <ul>
              <Menu list={menu} isOpen={isOpen} key={key} current={pathname} />
            </ul>
          </nav>
          <nav>
            <ul>
              <Menu
                list={additionalMenu}
                isOpen={isOpen}
                key={key}
                current={pathname}
                ext={true}
                toggle={toggle}
                showSocial={true}
              />
            </ul>
          </nav>
        </div>
        {!isOpen ? (
          <div className={styles.socialContainer}>
            <div>
              <a href={"https://twitter.com/loop_finance"} target={"_blank"}>
                <img src={twitter_icon} alt={""} />
              </a>
            </div>
            <div>
              <a href={"https://www.reddit.com/r/Loop/"} target={"_blank"}>
                <img src={reddit} alt={""} />
              </a>
            </div>
            <div>
              <a
                href={"https://discord.com/invite/loopfinance"}
                target={"_blank"}
              >
                <img src={discord} alt={""} />
              </a>
            </div>
            <div>
              <a href={"https://t.me/loopfinance"} target={"_blank"}>
                <img src={telegram} alt={""} />
              </a>
            </div>
          </div>
        ) : (
          <div
            className={classNames(
              styles.socialContainer,
              styles.socialContainerOpened
            )}
          >
            <div>
              <a href={"https://twitter.com/loop_finance"} target={"_blank"}>
                <img src={twitter_icon} alt={""} />
              </a>
            </div>
          </div>
        )}
      </div>
      {isOpen ? (
        <div
          className={classNames(styles.collapse_toggle_container)}
          onClick={() => toggle()}
        >
          <div className={styles.modeArrowContainer}>
            <img src={open_icon} alt={""} />
          </div>
        </div>
      ) : (
        <div className={styles.toggle_container} onClick={() => toggle()}>
          <img className={styles.toggle_icon} src={collapse_icon} />
        </div>
      )}
    </header>
  )
}

export default AppHeader
