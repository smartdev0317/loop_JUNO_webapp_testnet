import medium from "./Community/medium.png"
import discord from "./Community/discord.png"
import telegram from "./Community/telegram.png"
import twitter from "./Community/twitter.png"
import github from "./Community/github.png"

import Container from "./Container"
import ExtLink from "./ExtLink"
import Icon from "./Icon"
import styles from "./AppFooter.module.scss"

interface Props {
  network?: string
  project: string
}

const AppFooter = ({ network, project }: Props) => {
  const community = [
    {
      href: `#`,
      src: github,
      alt: "Github",
    },
    {
      href: "#",
      src: medium,
      alt: "Medium",
    },
    {
      href: "#",
      src: telegram,
      alt: "Telegram",
    },
    {
      href: "#",
      src: discord,
      alt: "Discord",
    },
    {
      href: "#",
      src: twitter,
      alt: "Twitter",
    },
  ]

  return (
    <footer className={styles.footer}>
      <Container className={styles.container}>
        {network && (
          <section className={styles.network}>
            <Icon name="wifi_tethering" size={20} />
            {network}
          </section>
        )}

        {community && (
          <section className={styles.community}>
            {community.map(
              ({ href, src, alt }) =>
                href && (
                  <ExtLink href={href} className={styles.link} key={alt}>
                    <img src={src} alt={""} width={20} height={20} />
                  </ExtLink>
                )
            )}
          </section>
        )}
      </Container>
    </footer>
  )
}

export default AppFooter
