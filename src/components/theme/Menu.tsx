import { Link } from "react-router-dom"
import classNames from "classnames"
import styles from "./Menu.module.scss"
// import logout_icon from "../../images/icons/24-logout.png"
// import connect_icon from "../../images/Switch.svg"
// import useAddress from "../../hooks/useAddress"
// import SimpleConnect from "../../layouts/SimpleConnect"
import { MenuKey, whiteListRoutes } from "../../routes"
import Tooltip from "../Tooltip"
// import TooltipContainer from "../Static/TooltipContainer"
const Menu = ({
  list,
  current,
  ext,
  sm,
  isOpen,
  showSocial = false,
}: {
  list: MenuItem[]
  isOpen?: boolean
  current?: string
  ext?: boolean
  sm?: boolean
  toggle?: () => void
  showSocial?: boolean
}) => {
  const pageName = window.location.pathname
  const stakingPage = pageName === "/staking" || pageName === "/buy-usdc"

  return (
    <ul
      className={classNames(
        styles.menu,
        ext ? styles.ext_menu : "",
        sm ? styles.sm_menu : ""
      )}
    >
      {list.map(({ attrs, desktopOnly }) => {
        if (isOpen) {
          return (
            <Tooltip
              content={
                <span>
                  {attrs.children == MenuKey.STAKE
                    ? "Stake & Vote"
                    : attrs.children}
                </span>
              }
              placement="right"
              arrow={true}
              tooltipClass={styles.tooltip}
            >
              <li
                className={classNames(styles.item, styles.pdL, {
                  desktop: desktopOnly,
                })}
                key={attrs.children}
              >
                {attrs.children !== MenuKey.PYLONRAISE &&
                  attrs.children !== MenuKey.BUYUST &&
                  attrs.children !== MenuKey.MINELOOP &&
                  (whiteListRoutes.includes(attrs.key) ? (
                    <Link
                      to={attrs.to}
                      className={classNames(
                        styles.link,
                        current === attrs.to && styles.active
                      )}
                    >
                      <img src={attrs.route_key} className={styles.icon} />
                      <img src={attrs.route_key1} className={styles.iconAct} />
                      {/* <span className={styles.content}> {attrs.children}</span> */}
                    </Link>
                  ) : (
                    <a className={classNames(styles.link, styles.Inactive)}>
                      <img src={attrs.route_key} className={styles.icon} />
                      <img src={attrs.route_key1} className={styles.iconAct} />
                    </a>
                  ))}

                {attrs.children === MenuKey.MINELOOP && (
                  <a
                    href="https://gateway.pylon.money/tokens/loop"
                    target="_blank"
                    rel="noreferrer"
                    className={classNames(
                      styles.link,
                      styles.pylonLink,
                      current === attrs.to && styles.active
                    )}
                  >
                    <img src={attrs.route_key ?? ""} className={styles.icon} />
                    <img src={attrs.route_key1} className={styles.iconAct} />
                    {/* <span className={styles.content}> {attrs.children}</span> */}
                  </a>
                )}

                {attrs.children === MenuKey.PYLONRAISE && (
                  <a
                    href="https://gateway.pylon.money/tokens/loop"
                    target="_blank"
                    rel="noreferrer"
                    className={classNames(
                      styles.link,
                      styles.pylonLink,
                      current === attrs.to && styles.active
                    )}
                  >
                    <img src={attrs.route_key ?? ""} className={styles.icon} />
                    <img src={attrs.route_key1} className={styles.iconAct} />
                    {/* <span className={styles.content}> {attrs.children}</span> */}
                  </a>
                )}
                {attrs.children === MenuKey.BUYUST && (
                  <Link
                    to={attrs.to}
                    className={classNames(
                      styles.link,
                      current === attrs.to && styles.active
                    )}
                  >
                    <img src={attrs.route_key} className={styles.icon} />
                    <img src={attrs.route_key1} className={styles.iconAct} />
                  </Link>
                )}
                {/* {attrs.children === MenuKey.BUYUST && (
            isOpen ? (
                
                <a
                onClick={() => {
                  openTransak()
                }}
                className={classNames(
                  styles.link,
                  styles.pylonLink,
                  current === attrs.to && styles.active
                )}
              >
                <img src={attrs.route_key ?? ""} className={styles.icon} />
                <img src={attrs.route_key1} className={styles.iconAct} />
              </a>
              )
              :(
                <>
                <a
                onClick={() => {
                  openTransak()
                }}
                className={classNames(
                  styles.link,
                  styles.pylonLink,
                  current === attrs.to && styles.active
                )}
              >
                <img src={attrs.route_key ?? ""} className={styles.icon} />
                <img src={attrs.route_key1} className={styles.iconAct} />
                <span className={styles.content}> {attrs.children}</span>
              </a>
                </>
              )

              
              
            )} */}
              </li>
            </Tooltip>
          )
        } else {
          return (
            <li
              className={classNames(styles.item, { desktop: desktopOnly })}
              key={attrs.children}
            >
              {attrs.children !== MenuKey.PYLONRAISE &&
                attrs.children !== MenuKey.BUYUST &&
                attrs.children !== MenuKey.MINELOOP &&
                (whiteListRoutes.includes(attrs.key) ? (
                  <Link
                    to={attrs.to}
                    className={classNames(
                      styles.link,
                      current === attrs.to && styles.active
                    )}
                  >
                    <img src={attrs.route_key} className={styles.icon} />
                    <img src={attrs.route_key1} className={styles.iconAct} />
                    <span className={styles.content}>
                      {" "}
                      {attrs.children == MenuKey.STAKE
                        ? "Stake & Vote"
                        : attrs.children}
                    </span>
                  </Link>
                ) : (
                  <a className={classNames(styles.link, styles.Inactive)}>
                    <img src={attrs.route_key} className={styles.icon} />
                    <img src={attrs.route_key1} className={styles.iconAct} />
                    <span className={styles.content}>
                      <Tooltip content="Coming Soon"> {attrs.children}</Tooltip>
                    </span>
                  </a>
                ))}

              {attrs.children === MenuKey.MINELOOP && (
                <a
                  href="https://gateway.pylon.money/tokens/loop"
                  target="_blank"
                  rel="noreferrer"
                  className={classNames(
                    styles.link,
                    styles.pylonLink,
                    current === attrs.to && styles.active
                  )}
                >
                  <img src={attrs.route_key ?? ""} className={styles.icon} />
                  <img src={attrs.route_key1} className={styles.iconAct} />
                  <span className={styles.content}> {attrs.children}</span>
                </a>
              )}

              {attrs.children === MenuKey.PYLONRAISE && (
                <a
                  href="https://gateway.pylon.money/tokens/loop"
                  target="_blank"
                  rel="noreferrer"
                  className={classNames(
                    styles.link,
                    styles.pylonLink,
                    current === attrs.to && styles.active
                  )}
                >
                  <img src={attrs.route_key ?? ""} className={styles.icon} />
                  <img src={attrs.route_key1} className={styles.iconAct} />
                  <span className={styles.content}> {attrs.children}</span>
                </a>
              )}
              {attrs.children === MenuKey.BUYUST && (
                <Link
                  to={attrs.to}
                  className={classNames(
                    styles.link,
                    current === attrs.to && styles.active
                  )}
                >
                  <img src={attrs.route_key} className={styles.icon} />
                  <img src={attrs.route_key1} className={styles.iconAct} />
                  <span className={styles.content}> {attrs.children}</span>
                </Link>
              )}
              {/* {attrs.children === MenuKey.BUYUST && (
              <a
                onClick={() => {
                  openTransak()
                }}
                className={classNames(
                  styles.link,
                  styles.pylonLink,
                  current === attrs.to && styles.active
                )}
              >
                <img src={attrs.route_key ?? ""} className={styles.icon} />
                <img src={attrs.route_key1} className={styles.iconAct} />
                <span className={styles.content}> {attrs.children}</span>
              </a>
            )} */}
            </li>
          )
        }
      })}
      {/* {ext && (
        <li className={classNames(styles.item)}>
          <SimpleConnect customStyle={styles.connect}>
            <img src={connect_icon ?? ""} className={styles.icon} />{" "}
            <span className={address ? styles.connected : styles.disconnected}>
              {address ? "Disconnect" : "Connect Wallet"}
            </span>
          </SimpleConnect>
        </li>
      )} */}
    </ul>
  )
}

export default Menu
